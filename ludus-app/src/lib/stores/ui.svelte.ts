export class UIStore {
	// Toast State
	toasts = $state<{ id: number, message: string, type: 'success' | 'error' | 'info' }[]>([]);
	private toastId = 0;

	// Modal State
	modalActive = $state(false);
	modalTitle = $state('');
	modalMessage = $state('');
	modalConfirmText = $state('Confirmar');
	modalCancelText = $state('Cancelar');
	
	// We use a promise resolver to pause execution like a native confirm()
	private modalResolver: ((value: boolean) => void) | null = null;

	// --- Toast Methods ---
	addToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
		const id = this.toastId++;
		this.toasts.push({ id, message, type });

		setTimeout(() => {
			this.toasts = this.toasts.filter(t => t.id !== id);
		}, duration);
	}

	// Helper for replacing alert()
	alert(message: string) {
		// Just throw an error toast that stays for 4s
		this.addToast(message, 'error', 4000);
	}

	success(message: string) {
		this.addToast(message, 'success', 3000);
	}

	// --- Confirm Modal Methods ---
	async confirm(message: string, title = 'Atenção'): Promise<boolean> {
		this.modalTitle = title;
		this.modalMessage = message;
		this.modalActive = true;

		return new Promise((resolve) => {
			this.modalResolver = resolve;
		});
	}

	resolveModal(result: boolean) {
		if (this.modalResolver) {
			this.modalResolver(result);
			this.modalResolver = null;
		}
		this.modalActive = false;
	}
}

export const ui = new UIStore();
