import { MessageSquare, Phone, Smartphone, Mail } from 'lucide-react';

// Provider-adapter interface. Every channel normalizes inbound traffic into the shared
// Conversation/Message model and feeds the same AI Manager. Only web chat is live today.
export const CHANNELS = {
  web: { label: 'Quivaro web chat', icon: MessageSquare, connected: true, provider: 'Built in' },
  whatsapp: { label: 'WhatsApp', icon: Phone, connected: false, provider: 'WhatsApp Business Platform' },
  sms: { label: 'iMessage / SMS', icon: Smartphone, connected: false, provider: 'Messaging gateway' },
  email: { label: 'Email', icon: Mail, connected: false, provider: 'Gmail / Outlook' },
};

export function createAdapter(channel) {
  const c = CHANNELS[channel];
  return {
    channel,
    connected: c.connected,
    normalize: (raw) => ({ channel, direction: 'inbound', sender: 'contact', text: String(raw.text || '') }),
    send: async () => {
      if (!c.connected) throw new Error(`${c.label} is not connected. Nothing was sent.`);
    },
  };
}