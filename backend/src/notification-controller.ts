import { Request, Response } from 'express';
import { supabase } from './services';

export const markNotificationsRead = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_email', user.email)
    .eq('is_read', false);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

export const deleteNotification = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Ensure user owns the notification by filtering on user_email
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_email', user.email);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

export const deleteAllNotifications = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_email', user.email);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};