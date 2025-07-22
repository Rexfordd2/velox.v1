import SwiftUI

struct NotificationsView: View {
    @StateObject private var viewModel = NotificationsViewModel()
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView()
                } else if viewModel.notifications.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "bell.slash")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        
                        Text("No notifications yet")
                            .font(.headline)
                            .foregroundColor(.gray)
                    }
                } else {
                    List {
                        ForEach(viewModel.notifications) { notification in
                            NotificationRow(notification: notification)
                                .onTapGesture {
                                    viewModel.markAsRead(notification)
                                }
                        }
                    }
                    .listStyle(PlainListStyle())
                }
            }
            .navigationTitle("Notifications")
            .navigationBarItems(trailing: Button(action: {
                viewModel.markAllAsRead()
            }) {
                Text("Mark all as read")
                    .foregroundColor(.blue)
            })
            .onAppear {
                viewModel.fetchNotifications()
            }
        }
    }
}

struct NotificationRow: View {
    let notification: Notification
    @State private var user: User?
    
    var body: some View {
        HStack(spacing: 12) {
            // User Avatar
            if let user = user {
                if let profileImageURL = user.profileImageURL {
                    AsyncImage(url: URL(string: profileImageURL)) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        ProgressView()
                    }
                    .frame(width: 40, height: 40)
                    .clipShape(Circle())
                } else {
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .frame(width: 40, height: 40)
                        .foregroundColor(.gray)
                }
            } else {
                Image(systemName: "person.circle.fill")
                    .resizable()
                    .frame(width: 40, height: 40)
                    .foregroundColor(.gray)
            }
            
            // Notification Content
            VStack(alignment: .leading, spacing: 4) {
                Text(notification.message)
                    .font(.subheadline)
                
                Text(notification.timestamp.timeAgoDisplay())
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            // Unread Indicator
            if !notification.isRead {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 8)
        .opacity(notification.isRead ? 0.6 : 1)
    }
} 