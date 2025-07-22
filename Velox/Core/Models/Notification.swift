import Foundation

enum NotificationType: String, Codable {
    case like
    case comment
    case follow
    case message
}

struct Notification: Identifiable, Codable {
    let id: String
    let type: NotificationType
    let senderId: String
    let receiverId: String
    let postId: String?
    let message: String
    let timestamp: Date
    var isRead: Bool
    
    init(dictionary: [String: Any]) {
        self.id = dictionary["id"] as? String ?? ""
        self.type = NotificationType(rawValue: dictionary["type"] as? String ?? "") ?? .like
        self.senderId = dictionary["senderId"] as? String ?? ""
        self.receiverId = dictionary["receiverId"] as? String ?? ""
        self.postId = dictionary["postId"] as? String
        self.message = dictionary["message"] as? String ?? ""
        self.timestamp = (dictionary["timestamp"] as? Timestamp)?.dateValue() ?? Date()
        self.isRead = dictionary["isRead"] as? Bool ?? false
    }
    
    init(id: String, type: NotificationType, senderId: String, receiverId: String, postId: String? = nil, message: String, timestamp: Date = Date(), isRead: Bool = false) {
        self.id = id
        self.type = type
        self.senderId = senderId
        self.receiverId = receiverId
        self.postId = postId
        self.message = message
        self.timestamp = timestamp
        self.isRead = isRead
    }
} 