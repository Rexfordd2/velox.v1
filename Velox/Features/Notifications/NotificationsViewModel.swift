import Foundation
import Firebase
import FirebaseFirestore

class NotificationsViewModel: ObservableObject {
    @Published var notifications: [Notification] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let db = Firestore.firestore()
    private var listenerRegistration: ListenerRegistration?
    
    func fetchNotifications() {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        isLoading = true
        
        listenerRegistration?.remove()
        
        listenerRegistration = db.collection("notifications")
            .whereField("receiverId", isEqualTo: currentUserId)
            .order(by: "timestamp", descending: true)
            .limit(to: 50)
            .addSnapshotListener { [weak self] snapshot, error in
                self?.isLoading = false
                
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                
                guard let documents = snapshot?.documents else { return }
                
                self?.notifications = documents.compactMap { document in
                    var data = document.data()
                    data["id"] = document.documentID
                    return Notification(dictionary: data)
                }
            }
    }
    
    func markAsRead(_ notification: Notification) {
        guard !notification.isRead else { return }
        
        db.collection("notifications")
            .document(notification.id)
            .updateData(["isRead": true]) { [weak self] error in
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                
                // Update local state
                if let index = self?.notifications.firstIndex(where: { $0.id == notification.id }) {
                    var updatedNotification = notification
                    updatedNotification.isRead = true
                    self?.notifications[index] = updatedNotification
                }
            }
    }
    
    func markAllAsRead() {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        let batch = db.batch()
        let unreadNotifications = notifications.filter { !$0.isRead }
        
        for notification in unreadNotifications {
            let notificationRef = db.collection("notifications").document(notification.id)
            batch.updateData(["isRead": true], forDocument: notificationRef)
        }
        
        batch.commit { [weak self] error in
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            // Update local state
            self?.notifications = self?.notifications.map { notification in
                var updatedNotification = notification
                updatedNotification.isRead = true
                return updatedNotification
            } ?? []
        }
    }
    
    deinit {
        listenerRegistration?.remove()
    }
} 