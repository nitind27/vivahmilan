export async function sendChatNotifications({ receiverId, senderId, senderName, roomId, messageObj, type, content }) {
  // 1. Send FCM Push Notification (for Flutter App)
  try {
    const { sendPushToMobile } = await import('@/lib/fcm');
    const notificationMsg = `${senderName} sent you a message.`;
    await sendPushToMobile(receiverId, {
      title: 'New Message',
      body: notificationMsg,
      data: { type: 'CHAT_MESSAGE', roomId, senderId }
    });
  } catch (err) {
    console.error('FCM Error:', err.message);
  }

  // 2. Send Web Push Notification (for Website)
  try {
    const { sendPushToUser } = await import('@/lib/webpush');
    const msgBody = type === 'IMAGE' ? '📷 Photo' : type === 'DOCUMENT' ? '📄 Document' : type === 'LOCATION' ? '📍 Location' : content;
    await sendPushToUser(receiverId, {
      title: `💬 ${senderName}`,
      body: msgBody,
      url: `/chat?userId=${senderId}`,
    });
  } catch (err) {
    console.error('WebPush Error:', err.message);
  }

  // 3. Emit Socket.io event (for real-time update on Website)
  try {
    const io = global.getIO?.();
    if (io) {
      // Emit to room but exclude sender's socket (sender already has message optimistically)
      const senderSocketId = [...(io.sockets.sockets.values())]
        .find(s => s.userId === senderId)?.id;
        
      // Emit to BOTH the chat room AND the receiver's personal room
      // This ensures the receiver gets the message even if they don't have the chat screen open
      const emitter = senderSocketId
        ? io.to([roomId, `user:${receiverId}`]).except(senderSocketId)
        : io.to([roomId, `user:${receiverId}`]);
      
      const emitPayload = { ...messageObj, _senderName: senderName };
      emitter.emit('message:receive', emitPayload);
      
      // Notify receiver's navbar badge (ONLY to the receiver's personal room)
      io.to(`user:${receiverId}`).emit('notification:new', { userId: receiverId });
    }
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
}
