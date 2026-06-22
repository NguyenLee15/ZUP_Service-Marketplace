const fs = require('fs');
const path = require('path');

function processFile(filePath, getSocketMethodName, urlPath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add import
  if (!content.includes(getSocketMethodName)) {
    // Find import of storage
    content = content.replace(
      /import \{ storage \} from "(.*?)\/lib\/storage";/,
      `import { storage } from "$1/lib/storage";\nimport { ${getSocketMethodName} } from "$1/lib/socket";`
    );
    // for single quote
    content = content.replace(
      /import \{ storage \} from '(.*?)\/lib\/storage';/,
      `import { storage } from '$1/lib/storage';\nimport { ${getSocketMethodName} } from '$1/lib/socket';`
    );
  }

  // 2. Replace socket = io(...) with getSocketMethodName().then(s => { socket = s;
  const ioRegex = new RegExp(`socket\\s*=\\s*io\\(.*${urlPath}.*\\);`, 's');
  // It looks like:
  // socket = io(`${WS_URL}/notifications`, { ... });
  // We can just find `socket = io(` and the corresponding `});`
  
  content = content.replace(/socket\s*=\s*io\([\s\S]*?\}\);/s, 
`${getSocketMethodName}().then((s) => {
          if (!active) return;
          socket = s;`);
  
  // Now we need to close the .then block at the end of the .then(token => ...) block
  // Wait, it's easier to just do a manual string replace for each file
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Notifications
let notif = fs.readFileSync(path.join(__dirname, '../fe/customer-mobile/app/notifications.tsx'), 'utf8');
notif = notif.replace(
  `import { storage } from "../lib/storage";`,
  `import { storage } from "../lib/storage";\nimport { getNotifSocket } from "../lib/socket";`
);
notif = notif.replace(
  `socket = io(\`\${WS_URL}/notifications\`, {
          transports: ["websocket"],
          auth: (cb) => {
            storage.getAccessToken().then(t => cb({ token: t }));
          },
        });`,
  `getNotifSocket().then((s) => {
          if (!active) return;
          socket = s;`
);
notif = notif.replace(
  `        socket.on("new_notification", (notification: NotificationItem) => {
          if (!active) return;
          queryClient.setQueryData<NotificationsPayload>(
            notificationsQueryKey,
            (current) => {
              const nextItems = dedupeNotifications([
                notification,
                ...(current?.items || []),
              ]);
              return {
                items: nextItems,
                unreadCount: nextItems.filter(isUnreadNotification).length,
              };
            },
          );
          invalidateUnread();
          setSocketMessage("Có thông báo mới.");
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        });
      })
      .catch(() => {`,
  `        socket.on("new_notification", (notification: NotificationItem) => {
          if (!active) return;
          queryClient.setQueryData<NotificationsPayload>(
            notificationsQueryKey,
            (current) => {
              const nextItems = dedupeNotifications([
                notification,
                ...(current?.items || []),
              ]);
              return {
                items: nextItems,
                unreadCount: nextItems.filter(isUnreadNotification).length,
              };
            },
          );
          invalidateUnread();
          setSocketMessage("Có thông báo mới.");
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        });
        });
      })
      .catch(() => {`
);
notif = notif.replace(
  `        socket.off("connect_error");
        socket.off("new_notification");
        socket.disconnect();
      }
    };
  }, [queryClient]);`,
  `        socket.off("connect_error");
        socket.off("new_notification");
      }
    };
  }, [queryClient]);`
);
fs.writeFileSync(path.join(__dirname, '../fe/customer-mobile/app/notifications.tsx'), notif, 'utf8');

// Chat Room
let chat = fs.readFileSync(path.join(__dirname, '../fe/customer-mobile/app/chat-room/[id]/index.tsx'), 'utf8');
chat = chat.replace(
  `import { storage } from '../../../lib/storage';`,
  `import { storage } from '../../../lib/storage';\nimport { getChatSocket } from '../../../lib/socket';`
);
chat = chat.replace(
  `        const socket = io(\`\${WS_URL}/chat\`, {
          transports: ['websocket'],
          auth: (cb) => {
            storage.getAccessToken().then(t => cb({ token: t }));
          },
        });
        socketRef.current = socket;`,
  `        getChatSocket().then((socket) => {
          if (!active) return;
          socketRef.current = socket;`
);
chat = chat.replace(
  `        socket.on('messageRecalled', (message: ChatMessage) => {
          if (!active || Number(message?.conversationId) !== conversationId) return;
          queryClient.setQueryData(['chat', conversationId, 'messages'], (current: ChatMessage[] = []) =>
            current.map((item) => (String(item.id) === String(message.id) ? message : item)),
          );
          queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        });
      })
      .catch((err) => {`,
  `        socket.on('messageRecalled', (message: ChatMessage) => {
          if (!active || Number(message?.conversationId) !== conversationId) return;
          queryClient.setQueryData(['chat', conversationId, 'messages'], (current: ChatMessage[] = []) =>
            current.map((item) => (String(item.id) === String(message.id) ? message : item)),
          );
          queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        });
        });
      })
      .catch((err) => {`
);
chat = chat.replace(
  `        socket.off('typing');
        socket.off('messageRecalled');
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [appendMessageToCache, conversationId, queryClient, validConversationId]);`,
  `        socket.off('typing');
        socket.off('messageRecalled');
      }
      socketRef.current = null;
    };
  }, [appendMessageToCache, conversationId, queryClient, validConversationId]);`
);
fs.writeFileSync(path.join(__dirname, '../fe/customer-mobile/app/chat-room/[id]/index.tsx'), chat, 'utf8');

// Tracking
let track = fs.readFileSync(path.join(__dirname, '../fe/customer-mobile/app/booking/[id]/track.tsx'), 'utf8');
track = track.replace(
  `import { storage } from '../../../lib/storage';`,
  `import { storage } from '../../../lib/storage';\nimport { getTrackingSocket } from '../../../lib/socket';`
);
track = track.replace(
  `        socket = io(\`\${WS_URL}/tracking\`, {
          transports: ['websocket'],
          auth: (cb) => {
            storage.getAccessToken().then(t => cb({ token: t }));
          },
        });`,
  `        getTrackingSocket().then((s) => {
          if (!active) return;
          socket = s;`
);
track = track.replace(
  `        socket.on('trackingEnded', (payload: any) => {
          if (!active || Number(payload?.bookingId) !== bookingId) return;
          setTrackingEnded(payload?.reason || 'Đã kết thúc theo dõi');
          setConnectionState('disconnected');
        });
      })
      .catch((error) => {`,
  `        socket.on('trackingEnded', (payload: any) => {
          if (!active || Number(payload?.bookingId) !== bookingId) return;
          setTrackingEnded(payload?.reason || 'Đã kết thúc theo dõi');
          setConnectionState('disconnected');
        });
        });
      })
      .catch((error) => {`
);
track = track.replace(
  `    return () => {
      active = false;
      subscription.remove();
      socket?.emit('unsubscribeTracking', { bookingId });
      socket?.disconnect();
    };
  }, [bookingId, socketRefreshKey, trackable, validBookingId]);`,
  `    return () => {
      active = false;
      subscription.remove();
      socket?.emit('unsubscribeTracking', { bookingId });
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('lastKnownLocation');
        socket.off('providerLocation');
        socket.off('trackingEnded');
      }
    };
  }, [bookingId, socketRefreshKey, trackable, validBookingId]);`
);
fs.writeFileSync(path.join(__dirname, '../fe/customer-mobile/app/booking/[id]/track.tsx'), track, 'utf8');

console.log('Refactor complete');
