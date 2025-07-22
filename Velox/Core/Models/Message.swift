import Foundation

struct Message: Identifiable, Codable {
    let id: String
    let senderId: String
    let receiverId: String
    let content: String
    let timestamp: Date
    var isRead: Bool
    
    init(dictionary: [String: Any]) {
        self.id = dictionary["id"] as? String ?? ""
        self.senderId = dictionary["senderId"] as? String ?? ""
        self.receiverId = dictionary["receiverId"] as? String ?? ""
        self.content = dictionary["content"] as? String ?? ""
        self.timestamp = (dictionary["timestamp"] as? Timestamp)?.dateValue() ?? Date()
        self.isRead = dictionary["isRead"] as? Bool ?? false
    }
    
    init(id: String, senderId: String, receiverId: String, content: String, timestamp: Date = Date(), isRead: Bool = false) {
        self.id = id
        self.senderId = senderId
        self.receiverId = receiverId
        self.content = content
        self.timestamp = timestamp
        self.isRead = isRead
    }
}

struct Chat: Identifiable {
    let id: String
    let participants: [String]
    let lastMessage: Message?
    let unreadCount: Int
} 