import Foundation
import Firebase
import FirebaseFirestore

class FeedViewModel: ObservableObject {
    @Published var posts: [Post] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let db = Firestore.firestore()
    
    func fetchPosts() {
        isLoading = true
        
        db.collection("posts")
            .order(by: "createdAt", descending: true)
            .limit(to: 20)
            .getDocuments { [weak self] snapshot, error in
                self?.isLoading = false
                
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                
                guard let documents = snapshot?.documents else { return }
                
                self?.posts = documents.compactMap { document in
                    var data = document.data()
                    data["id"] = document.documentID
                    return Post(dictionary: data)
                }
            }
    }
    
    func likePost(_ post: Post) {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        let postRef = db.collection("posts").document(post.id)
        let userLikesRef = db.collection("users").document(currentUserId).collection("likes").document(post.id)
        
        db.runTransaction { transaction, errorPointer in
            let postSnapshot: DocumentSnapshot
            do {
                try postSnapshot = transaction.getDocument(postRef)
            } catch let fetchError as NSError {
                errorPointer?.pointee = fetchError
                return nil
            }
            
            guard var postData = postSnapshot.data() else { return nil }
            let likes = postData["likes"] as? Int ?? 0
            
            if post.isLiked {
                transaction.updateData(["likes": likes - 1], forDocument: postRef)
                transaction.deleteDocument(userLikesRef)
            } else {
                transaction.updateData(["likes": likes + 1], forDocument: postRef)
                transaction.setData([:], forDocument: userLikesRef)
            }
            
            return nil
        } completion: { [weak self] _, error in
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            // Update local state
            if let index = self?.posts.firstIndex(where: { $0.id == post.id }) {
                var updatedPost = post
                updatedPost.likes += post.isLiked ? -1 : 1
                updatedPost.isLiked.toggle()
                self?.posts[index] = updatedPost
            }
        }
    }
    
    func createPost(caption: String, imageURL: String?) {
        guard let currentUser = Auth.auth().currentUser else { return }
        
        let postData: [String: Any] = [
            "userId": currentUser.uid,
            "username": currentUser.displayName ?? "",
            "caption": caption,
            "imageURL": imageURL as Any,
            "createdAt": Timestamp(date: Date()),
            "likes": 0,
            "comments": 0
        ]
        
        db.collection("posts").addDocument(data: postData) { [weak self] error in
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            self?.fetchPosts()
        }
    }
} 