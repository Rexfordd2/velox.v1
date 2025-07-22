import Foundation
import Firebase
import FirebaseFirestore

class SearchViewModel: ObservableObject {
    @Published var searchResults: [User] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let db = Firestore.firestore()
    
    func searchUsers(query: String) {
        guard !query.isEmpty else {
            searchResults = []
            return
        }
        
        isLoading = true
        
        db.collection("users")
            .whereField("username", isGreaterThanOrEqualTo: query)
            .whereField("username", isLessThanOrEqualTo: query + "\u{f8ff}")
            .limit(to: 20)
            .getDocuments { [weak self] snapshot, error in
                self?.isLoading = false
                
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                
                guard let documents = snapshot?.documents else { return }
                
                self?.searchResults = documents.compactMap { document in
                    var data = document.data()
                    data["id"] = document.documentID
                    return User(dictionary: data)
                }
            }
    }
    
    func followUser(_ user: User) {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        let batch = db.batch()
        
        // Add to current user's following
        let followingRef = db.collection("users").document(currentUserId).collection("following").document(user.id)
        batch.setData([:], forDocument: followingRef)
        
        // Add to target user's followers
        let followersRef = db.collection("users").document(user.id).collection("followers").document(currentUserId)
        batch.setData([:], forDocument: followersRef)
        
        // Update follower/following counts
        let currentUserRef = db.collection("users").document(currentUserId)
        batch.updateData(["following": FieldValue.increment(Int64(1))], forDocument: currentUserRef)
        
        let targetUserRef = db.collection("users").document(user.id)
        batch.updateData(["followers": FieldValue.increment(Int64(1))], forDocument: targetUserRef)
        
        batch.commit { [weak self] error in
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            // Update local state
            if let index = self?.searchResults.firstIndex(where: { $0.id == user.id }) {
                var updatedUser = user
                updatedUser.followers += 1
                self?.searchResults[index] = updatedUser
            }
        }
    }
    
    func unfollowUser(_ user: User) {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        let batch = db.batch()
        
        // Remove from current user's following
        let followingRef = db.collection("users").document(currentUserId).collection("following").document(user.id)
        batch.deleteDocument(followingRef)
        
        // Remove from target user's followers
        let followersRef = db.collection("users").document(user.id).collection("followers").document(currentUserId)
        batch.deleteDocument(followersRef)
        
        // Update follower/following counts
        let currentUserRef = db.collection("users").document(currentUserId)
        batch.updateData(["following": FieldValue.increment(Int64(-1))], forDocument: currentUserRef)
        
        let targetUserRef = db.collection("users").document(user.id)
        batch.updateData(["followers": FieldValue.increment(Int64(-1))], forDocument: targetUserRef)
        
        batch.commit { [weak self] error in
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            // Update local state
            if let index = self?.searchResults.firstIndex(where: { $0.id == user.id }) {
                var updatedUser = user
                updatedUser.followers -= 1
                self?.searchResults[index] = updatedUser
            }
        }
    }
} 