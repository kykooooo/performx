-- Add read tracking to conversation participants
ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz DEFAULT now();

-- RPC: count total unread messages across all conversations for a user
CREATE OR REPLACE FUNCTION get_total_unread_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_total integer;
BEGIN
  SELECT coalesce(sum(unread), 0)::integer INTO v_total
  FROM (
    SELECT count(m.id) AS unread
    FROM conversation_participants cp
    JOIN messages m ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = v_user_id
      AND m.sender_id <> v_user_id
      AND m.created_at > cp.last_read_at
    GROUP BY cp.conversation_id
  ) sub;

  RETURN v_total;
END;
$$;

-- Update last_read_at when user opens a conversation (called from client)
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
END;
$$;
