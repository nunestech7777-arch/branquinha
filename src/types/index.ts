export interface DateResponse {
  id?: string;
  invitation_id: string;
  selected_time: '19:00' | '20:00';
  response: 'accepted';
  created_at?: string;
  updated_at?: string;
}

export type InvitationStep = 'ask' | 'time' | 'confirmed';
