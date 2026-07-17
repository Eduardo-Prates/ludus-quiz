import { supabase } from '$lib/supabase';

export class GameState {
	// Local state
	score = $state(0);
	playerName = $state('');
	playerId = $state<string | null>(null);
	roomId = $state<string | null>(null);
	roomPin = $state('');
	isHost = $state(false);
	players = $state<{ id: string; name: string; score: number }[]>([]);

	// Current question info
	currentQuestion = $state<string | null>(null);
	options = $state<any[]>([]);
	correctId = $state<number | null>(null);
	timeRemaining = $state(0);
	status = $state<'lobby' | 'question_active' | 'leaderboard'>('lobby');
	leaderboard = $state<{ id: string; name: string; score: number }[]>([]);
	
	// Host quiz data
	questionsList = $state<any[]>([]);
	currentQuestionIndex = $state(0);
	private channel = $state<any>(null);

	async createRoom() {
		// Reset state for a new game
		this.players = [];
		this.leaderboard = [];
		this.status = 'lobby';
		this.currentQuestionIndex = 0;
		this.score = 0;

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

		// Subscribe to players joining this room
		this.channel = supabase.channel(`room:${this.roomId}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'players', filter: `room_id=eq.${this.roomId}` },
				(payload) => {
					this.players = [...this.players, payload.new as any];
				}
			)
			.subscribe();
	}

	async joinRoom(pin: string, name: string) {
		// Find room
		const { data: roomData, error: roomError } = await supabase
			.from('rooms')
			.select('id, status')
			.eq('pin', pin)
			.single();

		if (roomError || !roomData) {
			alert('Sala não encontrada!');
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
			alert('Erro ao entrar na sala.');
			return false;
		}

		this.playerId = playerData.id;

		// Subscribe to room status changes (to know when question starts)
		this.channel = supabase.channel(`player:${this.playerId}`)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${this.roomId}` },
				(payload) => {
					this.status = payload.new.status;
					if (payload.new.status === 'question_active') {
						const q = payload.new.current_question;
						this.currentQuestion = q.text;
						this.options = q.options;
						this.correctId = q.correctId;
					} else if (payload.new.status === 'leaderboard') {
						this.fetchLeaderboard();
					}
				}
			)
			.subscribe();

		return true;
	}

	async addScore(points: number) {
		this.score += points;
		if (this.playerId) {
			await supabase
				.from('players')
				.update({ score: this.score })
				.eq('id', this.playerId);
		}
	}

	async hostStartQuestion(questionText: string, options: any[], correctId: number) {
		if (!this.roomId) return;
		
		const current_question = { text: questionText, options, correctId };
		
		await supabase
			.from('rooms')
			.update({ status: 'question_active', current_question })
			.eq('id', this.roomId);
			
		this.status = 'question_active';
	}

	async hostShowLeaderboard() {
		if (!this.roomId) return;
		
		await supabase
			.from('rooms')
			.update({ status: 'leaderboard' })
			.eq('id', this.roomId);
			
		this.status = 'leaderboard';
		await this.fetchLeaderboard();
	}

	async fetchLeaderboard() {
		if (!this.roomId) return;

		const { data, error } = await supabase
			.from('players')
			.select('id, name, score')
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


