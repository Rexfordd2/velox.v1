import SwiftUI

struct MessagesView: View {
    @StateObject private var viewModel = MessagesViewModel()
    @State private var selectedChat: Chat?
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.chats) { chat in
                    ChatRow(chat: chat)
                        .onTapGesture {
                            selectedChat = chat
                        }
                }
            }
            .navigationTitle("Messages")
            .sheet(item: $selectedChat) { chat in
                ChatView(chat: chat, viewModel: viewModel)
            }
            .onAppear {
                viewModel.fetchChats()
            }
        }
    }
}

struct ChatRow: View {
    let chat: Chat
    
    var body: some View {
        HStack {
            // Profile Image
            Image(systemName: "person.circle.fill")
                .resizable()
                .frame(width: 50, height: 50)
                .foregroundColor(.gray)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(chat.participants.first ?? "")
                    .font(.headline)
                
                if let lastMessage = chat.lastMessage {
                    Text(lastMessage.content)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            // Unread Count
            if chat.unreadCount > 0 {
                Text("\(chat.unreadCount)")
                    .font(.caption)
                    .foregroundColor(.white)
                    .frame(width: 24, height: 24)
                    .background(Color.blue)
                    .clipShape(Circle())
            }
        }
        .padding(.vertical, 8)
    }
}

struct ChatView: View {
    let chat: Chat
    @ObservedObject var viewModel: MessagesViewModel
    @State private var messageText = ""
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack {
            // Messages
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.messages) { message in
                        MessageBubble(message: message)
                    }
                }
                .padding()
            }
            
            // Message Input
            HStack {
                TextField("Message", text: $messageText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)
                
                Button(action: {
                    guard !messageText.isEmpty else { return }
                    viewModel.sendMessage(messageText, to: chat.participants.first ?? "")
                    messageText = ""
                }) {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.blue)
                }
                .padding(.trailing)
            }
            .padding(.vertical, 8)
            .background(Color(.systemBackground))
            .shadow(radius: 1)
        }
        .navigationTitle(chat.participants.first ?? "")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.fetchMessages(for: chat.id)
        }
    }
}

struct MessageBubble: View {
    let message: Message
    @State private var user: User?
    
    var body: some View {
        HStack {
            if message.senderId == Auth.auth().currentUser?.uid {
                Spacer()
            }
            
            VStack(alignment: message.senderId == Auth.auth().currentUser?.uid ? .trailing : .leading) {
                Text(message.content)
                    .padding(12)
                    .background(message.senderId == Auth.auth().currentUser?.uid ? Color.blue : Color(.systemGray5))
                    .foregroundColor(message.senderId == Auth.auth().currentUser?.uid ? .white : .primary)
                    .cornerRadius(16)
                
                Text(message.timestamp.timeAgoDisplay())
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            
            if message.senderId != Auth.auth().currentUser?.uid {
                Spacer()
            }
        }
    }
} 