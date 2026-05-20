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
      const emitter = senderSocketId
        ? io.to(roomId).except(senderSocketId)
        : io.to(roomId);
      
      // Ensure the message has sender name for the web UI
      const emitPayload = { ...messageObj, _senderName: senderName };
      emitter.emit('message:receive', emitPayload);
      
      // Notify receiver's navbar badge
      io.emit('notification:new', { userId: receiverId });
    }
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
}
