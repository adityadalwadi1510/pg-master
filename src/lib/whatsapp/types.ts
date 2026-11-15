export interface WhatsAppWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value?: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string; // e.g. "919876543210"
        }>;
        messages?: Array<WhatsAppIncomingMessage>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface WhatsAppIncomingMessage {
  from: string; // e.g. "919876543210"
  id: string; // e.g. "wamid.HBgL..."
  timestamp: string;
  type: 'text' | 'interactive' | 'image' | 'button' | 'location';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
}

export type BotActionIntent =
  | 'VIEW_RENT'
  | 'RAISE_COMPLAINT'
  | 'VACATE_NOTICE'
  | 'SUPPORT_CONTACTS'
  | 'MAIN_MENU';

