import Foundation

struct Post: Identifiable, Codable {
    let id: String
    let userId: String
    let username: String
    let caption: String
    let imageURL: String?
    let createdAt: Date
    var likes: Int
    var comments: Int
    var isLiked: Bool
    
    init(dictionary: [String: Any]) {
        self.id = dictionary["id"] as? String ?? ""
        self.userId = dictionary["userId"] as? String ?? ""
        self.username = dictionary["username"] as? String ?? ""
        self.caption = dictionary["caption"] as? String ?? ""
        self.imageURL = dictionary["imageURL"] as? String
        self.createdAt = (dictionary["createdAt"] as? Timestamp)?.dateValue() ?? Date()
        self.likes = dictionary["likes"] as? Int ?? 0
        self.comments = dictionary["comments"] as? Int ?? 0
        self.isLiked = dictionary["isLiked"] as? Bool ?? false
    }
    
    init(id: String, userId: String, username: String, caption: String, imageURL: String? = nil, createdAt: Date = Date(), likes: Int = 0, comments: Int = 0, isLiked: Bool = false) {
        self.id = id
        self.userId = userId
        self.username = username
        self.caption = caption
        self.imageURL = imageURL
        self.createdAt = createdAt
        self.likes = likes
        self.comments = comments
        self.isLiked = isLiked
    }
} 