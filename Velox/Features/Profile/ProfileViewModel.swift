import Foundation
import Firebase
import FirebaseFirestore

class ProfileViewModel: ObservableObject {
    @Published var user: User?
    @Published var posts: [Post] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let db = Firestore.firestore()
    
    func fetchUserProfile() {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        isLoading = true
        
        db.collection("users").document(currentUserId).getDocument { [weak self] snapshot, error in
            self?.isLoading = false
            
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            guard let data = snapshot?.data() else { return }
            var userData = data
            userData["id"] = currentUserId
            self?.user = User(dictionary: userData)
            
            self?.fetchUserPosts()
        }
    }
    
    private func fetchUserPosts() {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        db.collection("posts")
            .whereField("userId", isEqualTo: currentUserId)
            .order(by: "createdAt", descending: true)
            .getDocuments { [weak self] snapshot, error in
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
    
    func updateProfile(username: String, bio: String) {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        let updates: [String: Any] = [
            "username": username,
            "bio": bio
        ]
        
        db.collection("users").document(currentUserId).updateData(updates) { [weak self] error in
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            self?.fetchUserProfile()
        }
    }
    
    func updateProfileImage(_ image: UIImage) {
        guard let currentUserId = Auth.auth().currentUser?.uid,
              let imageData = image.jpegData(compressionQuality: 0.5) else { return }
        
        let storageRef = Storage.storage().reference().child("profile_images/\(currentUserId).jpg")
        
        storageRef.putData(imageData, metadata: nil) { [weak self] metadata, error in
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            storageRef.downloadURL { url, error in
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                
                guard let downloadURL = url else { return }
                
                self?.db.collection("users").document(currentUserId).updateData([
                    "profileImageURL": downloadURL.absoluteString
                ]) { error in
                    if let error = error {
                        self?.errorMessage = error.localizedDescription
                        return
                    }
                    
                    self?.fetchUserProfile()
                }
            }
        }
    }
    
    func signOut() {
        do {
            try Auth.auth().signOut()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
} 