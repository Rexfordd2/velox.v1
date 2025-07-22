import Foundation

struct User: Identifiable, Codable {
    let id: String
    let username: String
    let email: String
    let createdAt: Date
    var followers: Int
    var following: Int
    var profileImageURL: String?
    var bio: String?
    
    init(dictionary: [String: Any]) {
        self.id = dictionary["id"] as? String ?? ""
        self.username = dictionary["username"] as? String ?? ""
        self.email = dictionary["email"] as? String ?? ""
        self.createdAt = (dictionary["createdAt"] as? Timestamp)?.dateValue() ?? Date()
        self.followers = dictionary["followers"] as? Int ?? 0
        self.following = dictionary["following"] as? Int ?? 0
        self.profileImageURL = dictionary["profileImageURL"] as? String
        self.bio = dictionary["bio"] as? String
    }
    
    init(id: String, username: String, email: String, createdAt: Date = Date(), followers: Int = 0, following: Int = 0, profileImageURL: String? = nil, bio: String? = nil) {
        self.id = id
        self.username = username
        self.email = email
        self.createdAt = createdAt
        self.followers = followers
        self.following = following
        self.profileImageURL = profileImageURL
        self.bio = bio
    }
} 