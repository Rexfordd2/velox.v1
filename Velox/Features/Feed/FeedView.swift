import SwiftUI

struct FeedView: View {
    @StateObject private var viewModel = FeedViewModel()
    @State private var showingNewPostSheet = false
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            ForEach(viewModel.posts) { post in
                                PostView(post: post, onLike: {
                                    viewModel.likePost(post)
                                })
                                Divider()
                            }
                        }
                    }
                }
            }
            .navigationTitle("Feed")
            .navigationBarItems(trailing: Button(action: {
                showingNewPostSheet = true
            }) {
                Image(systemName: "plus")
            })
            .sheet(isPresented: $showingNewPostSheet) {
                NewPostView(viewModel: viewModel)
            }
            .onAppear {
                viewModel.fetchPosts()
            }
        }
    }
}

struct PostView: View {
    let post: Post
    let onLike: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // User info
            HStack {
                Image(systemName: "person.circle.fill")
                    .resizable()
                    .frame(width: 40, height: 40)
                    .foregroundColor(.gray)
                
                Text(post.username)
                    .font(.headline)
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "ellipsis")
                }
            }
            .padding(.horizontal)
            
            // Post image
            if let imageURL = post.imageURL {
                AsyncImage(url: URL(string: imageURL)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    ProgressView()
                }
            }
            
            // Actions
            HStack(spacing: 16) {
                Button(action: onLike) {
                    Image(systemName: post.isLiked ? "heart.fill" : "heart")
                        .foregroundColor(post.isLiked ? .red : .primary)
                }
                
                Button(action: {}) {
                    Image(systemName: "message")
                }
                
                Button(action: {}) {
                    Image(systemName: "paperplane")
                }
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "bookmark")
                }
            }
            .padding(.horizontal)
            
            // Likes
            if post.likes > 0 {
                Text("\(post.likes) likes")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .padding(.horizontal)
            }
            
            // Caption
            HStack {
                Text(post.username)
                    .fontWeight(.semibold)
                Text(post.caption)
            }
            .font(.subheadline)
            .padding(.horizontal)
            
            // Comments
            if post.comments > 0 {
                Button(action: {}) {
                    Text("View all \(post.comments) comments")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.horizontal)
            }
            
            // Timestamp
            Text(post.createdAt.timeAgoDisplay())
                .font(.caption)
                .foregroundColor(.gray)
                .padding(.horizontal)
                .padding(.top, 4)
        }
        .padding(.vertical, 8)
    }
}

struct NewPostView: View {
    @Environment(\.presentationMode) var presentationMode
    @ObservedObject var viewModel: FeedViewModel
    @State private var caption = ""
    @State private var showingImagePicker = false
    @State private var selectedImage: UIImage?
    
    var body: some View {
        NavigationView {
            VStack {
                if let image = selectedImage {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 300)
                }
                
                TextField("Write a caption...", text: $caption)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding()
                
                Button(action: {
                    showingImagePicker = true
                }) {
                    Text("Select Image")
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationTitle("New Post")
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                },
                trailing: Button("Share") {
                    // TODO: Implement image upload
                    viewModel.createPost(caption: caption, imageURL: nil)
                    presentationMode.wrappedValue.dismiss()
                }
                .disabled(caption.isEmpty)
            )
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(image: $selectedImage)
            }
        }
    }
}

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}

extension Date {
    func timeAgoDisplay() -> String {
        let calendar = Calendar.current
        let now = Date()
        let components = calendar.dateComponents([.minute, .hour, .day, .weekOfMonth], from: self, to: now)
        
        if let day = components.day, day > 0 {
            return day == 1 ? "1 day ago" : "\(day) days ago"
        } else if let hour = components.hour, hour > 0 {
            return hour == 1 ? "1 hour ago" : "\(hour) hours ago"
        } else if let minute = components.minute, minute > 0 {
            return minute == 1 ? "1 minute ago" : "\(minute) minutes ago"
        } else {
            return "Just now"
        }
    }
} 