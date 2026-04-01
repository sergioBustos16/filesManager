export const useToast = () => {
  const message = useState<string | null>('toast_message', () => null);
  const kind = useState<'success' | 'error' | 'info'>('toast_kind', () => 'info');

  const show = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    message.value = msg;
    kind.value = type;
    window.setTimeout(() => {
      message.value = null;
    }, 4200);
  };

  return { message, kind, show };
};
