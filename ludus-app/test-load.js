import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manually since this is a pure Node script
const envPath = path.join(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_KEY = env['VITE_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('ERRO: Não foi possível ler as credenciais do Supabase no .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PIN = process.argv[2];
const BOTS_COUNT = 60;

if (!PIN) {
    console.error('Uso: node test-load.js <PIN_DA_SALA>');
    process.exit(1);
}

async function runTest() {
    console.log(`🚀 Iniciando Teste de Carga para a sala: ${PIN}`);
    console.log(`🤖 Criando ${BOTS_COUNT} jogadores virtuais...\n`);

    // 1. Fetch Room
    const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('pin', PIN)
        .single();

    if (roomError || !roomData) {
        console.error('❌ Sala não encontrada!');
        return;
    }

    const roomId = roomData.id;
    const bots = [];

    // 2. Insert Players
    process.stdout.write('Inserindo bots no banco...');
    for (let i = 0; i < BOTS_COUNT; i++) {
        const name = `Botzinho #${i + 1}`;
        const { data: playerData } = await supabase
            .from('players')
            .insert([{ room_id: roomId, name: name }])
            .select()
            .single();
            
        if (playerData) {
            bots.push(playerData.id);
        }
    }
    console.log(` ✅ ${bots.length} inseridos!`);

    // 3. Connect to WebSockets
    console.log('🔌 Conectando aos canais Realtime...');
    
    let receivedCount = 0;
    const startTime = Date.now();

    bots.forEach((botId) => {
        supabase.channel(`player:${botId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
                async (payload) => {
                    if (payload.new.status === 'question_active') {
                        receivedCount++;
                        const latency = Date.now() - startTime;
                        
                        if (receivedCount === 1) {
                            console.log(`\n📡 SINAL RECEBIDO!`);
                            console.log(`⚡ Primeiro bot recebeu a pergunta em: ${latency}ms`);
                        }
                        
                        if (receivedCount === BOTS_COUNT) {
                            console.log(`⚡ Último bot recebeu a pergunta em: ${latency}ms`);
                            console.log(`\n✅ Sucesso! O Supabase aguentou a transmissão para ${BOTS_COUNT} clientes simultâneos!`);
                            console.log(`Pode fechar este script com Ctrl+C.`);
                        }

                        // Simular resposta rápida (escrever score de volta)
                        const randomScore = Math.floor(Math.random() * 1000);
                        await supabase.from('players').update({ score: randomScore }).eq('id', botId);
                    }
                }
            )
            .subscribe();
    });

    console.log('\n🎯 TUDO PRONTO!');
    console.log('-> Vá no seu navegador (Painel do Host) e clique em "Lançar Pergunta".');
    console.log('-> O script vai medir o gargalo de rede e a resposta de todos os 60 clientes...');
}

runTest();
