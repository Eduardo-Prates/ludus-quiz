import { supabase } from '$lib/supabase';
import { ui } from '$lib/stores/ui.svelte';

export class GameState {
	// Local state
	score = $state(0);
	correctAnswersCount = $state(0);
	playerName = $state('');
	playerId = $state<string | null>(null);
	roomId = $state<string | null>(null);
	roomPin = $state('');
	isHost = $state(false);
	players = $state<{ id: string; name: string; score: number, correct_answers?: number }[]>([]);

	// Current question info
	currentQuestion = $state<string | null>(null);
	imageUrl = $state<string | null>(null);
	options = $state<any[]>([]);
	correctId = $state<number | null>(null);
	timeRemaining = $state(0);
	status = $state<'lobby' | 'question_active' | 'leaderboard'>('lobby');
	leaderboard = $state<{ id: string; name: string; score: number, correct_answers: number }[]>([]);
	timeLimit = $state(20);
	answeredCount = $state(0);
	
	// Host quiz data
	questionsList = $state<any[]>([]);
	currentQuestionIndex = $state(0);
	timePerQuestion = $state(20);
	private channel = $state<any>(null);

	async createRoom() {
		// Reset state for a new game
		this.players = [];
		this.leaderboard = [];
		this.status = 'lobby';
		this.currentQuestionIndex = 0;
		this.score = 0;
		this.correctAnswersCount = 0;

		if (this.channel) {
			supabase.removeChannel(this.channel);
			this.channel = null;
		}

		// Generate random 6-digit PIN
		const pin = Math.floor(100000 + Math.random() * 900000).toString();
		this.roomPin = pin;
		this.isHost = true;

		const { data, error } = await supabase
			.from('rooms')
			.insert([{ pin, status: 'lobby' }])
			.select()
			.single();

		if (error) {
			console.error('Error creating room:', error);
			return;
		}

		this.roomId = data.id;

		// Save to localStorage for History
		if (typeof window !== 'undefined') {
			const historyRaw = localStorage.getItem('ludus_history') || '[]';
			try {
				const history = JSON.parse(historyRaw);
				history.push({
					id: data.id,
					pin: data.pin,
					date: new Date().toISOString()
				});
				localStorage.setItem('ludus_history', JSON.stringify(history));
			} catch (e) {
				console.error('Failed to save history', e);
			}
		}

		// Subscribe to players joining this room
		this.channel = supabase.channel(`room:${this.roomId}`, {
			config: { broadcast: { self: true } }
		})
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'players', filter: `room_id=eq.${this.roomId}` },
				(payload) => {
					this.players = [...this.players, payload.new as any];
				}
			)
			.on('broadcast', { event: 'player_answered' }, (payload) => {
				if (this.isHost) {
					this.answeredCount++;
				}
			})
			.subscribe();
	}

	async joinRoom(pin: string, name: string) {
		// Reset previous player state if rejoining without reload
		this.score = 0;
		this.correctAnswersCount = 0;
		this.leaderboard = [];
		this.currentQuestion = null;
		this.imageUrl = null;
		this.options = [];
		this.correctId = null;
		
		if (this.channel) {
			supabase.removeChannel(this.channel);
			this.channel = null;
		}

		// Find room
		const { data: roomData, error: roomError } = await supabase
			.from('rooms')
			.select('id, status')
			.eq('pin', pin)
			.single();

		if (roomError || !roomData) {
			ui.alert('Sala não encontrada!');
			return false;
		}

		this.roomId = roomData.id;
		this.roomPin = pin;
		this.playerName = name;
		this.status = roomData.status as any;

		// Add player to DB
		const { data: playerData, error: playerError } = await supabase
			.from('players')
			.insert([{ room_id: this.roomId, name: name }])
			.select()
			.single();

		if (playerError) {
			ui.alert('Erro ao entrar na sala.');
			return false;
		}

		this.playerId = playerData.id;

		// Subscribe to room status changes (to know when question starts)
		this.channel = supabase.channel(`room:${this.roomId}`, {
			config: { broadcast: { self: true } }
		})
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${this.roomId}` },
				(payload) => {
					this.status = payload.new.status;
					if (payload.new.status === 'question_active') {
						const q = payload.new.current_question;
						this.currentQuestion = q.text;
						this.imageUrl = q.imageUrl || null;
						this.options = q.options;
						this.correctId = q.correctId;
						this.timeLimit = q.timeLimit || 20;
					} else if (payload.new.status === 'leaderboard') {
						this.fetchLeaderboard();
					}
				}
			)
			.subscribe();

		return true;
	}

	async addScore(points: number, isCorrect: boolean = false) {
		this.score += points;
		if (isCorrect) {
			this.correctAnswersCount++;
		}
		if (this.playerId) {
			await supabase
				.from('players')
				.update({ score: this.score, correct_answers: this.correctAnswersCount })
				.eq('id', this.playerId);
		}
	}

	async hostStartQuestion(questionText: string, options: any[], correctId: number, timeLimit: number, imageUrl?: string) {
		if (!this.roomId) return;
		
		this.answeredCount = 0;
		
		const current_question = { text: questionText, imageUrl: imageUrl || null, options, correctId, timeLimit };
		
		await supabase
			.from('rooms')
			.update({ status: 'question_active', current_question })
			.eq('id', this.roomId);
			
		this.status = 'question_active';
	}

	notifyAnswered() {
		if (this.channel) {
			this.channel.send({
				type: 'broadcast',
				event: 'player_answered',
				payload: { playerId: this.playerId }
			});
		}
	}

	async hostShowLeaderboard() {
		if (!this.roomId) return;
		
		await supabase
			.from('rooms')
			.update({ status: 'leaderboard' })
			.eq('id', this.roomId);
			
		this.status = 'leaderboard';
		// Aguarda os celulares dos alunos enviarem as pontuações ao banco antes de buscar
		await new Promise(resolve => setTimeout(resolve, 1200));
		await this.fetchLeaderboard();
	}

	async fetchLeaderboard() {
		if (!this.roomId) return;

		const { data, error } = await supabase
			.from('players')
			.select('id, name, score, correct_answers')
			.eq('room_id', this.roomId)
			.order('score', { ascending: false });

		if (!error && data) {
			this.leaderboard = data;
		}
	}

	reset() {
		this.score = 0;
	}
}

// Global instance for local state management
export const game = new GameState();


