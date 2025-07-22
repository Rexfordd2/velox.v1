import SwiftUI

struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @State private var showingEditProfile = false
    @State private var showingImagePicker = false
    @State private var selectedImage: UIImage?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Profile Header
                    VStack(spacing: 16) {
                        // Profile Image
                        Button(action: {
                            showingImagePicker = true
                        }) {
                            if let profileImageURL = viewModel.user?.profileImageURL {
                                AsyncImage(url: URL(string: profileImageURL)) { image in
                                    image
                                        .resizable()
                                        .scaledToFill()
                                } placeholder: {
                                    ProgressView()
                                }
                                .frame(width: 100, height: 100)
                                .clipShape(Circle())
                            } else {
                                Image(systemName: "person.circle.fill")
                                    .resizable()
                                    .frame(width: 100, height: 100)
                                    .foregroundColor(.gray)
                            }
                        }
                        
                        // User Info
                        VStack(spacing: 4) {
                            Text(viewModel.user?.username ?? "")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            if let bio = viewModel.user?.bio {
                                Text(bio)
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                    .multilineTextAlignment(.center)
                            }
                        }
                        
                        // Stats
                        HStack(spacing: 40) {
                            VStack {
                                Text("\(viewModel.posts.count)")
                                    .font(.headline)
                                Text("Posts")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            
                            VStack {
                                Text("\(viewModel.user?.followers ?? 0)")
                                    .font(.headline)
                                Text("Followers")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            
                            VStack {
                                Text("\(viewModel.user?.following ?? 0)")
                                    .font(.headline)
                                Text("Following")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                        }
                        
                        // Edit Profile Button
                        Button(action: {
                            showingEditProfile = true
                        }) {
                            Text("Edit Profile")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(10)
                        }
                        .padding(.horizontal)
                    }
                    .padding(.top)
                    
                    // Posts Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 1) {
                        ForEach(viewModel.posts) { post in
                            if let imageURL = post.imageURL {
                                AsyncImage(url: URL(string: imageURL)) { image in
                                    image
                                        .resizable()
                                        .scaledToFill()
                                } placeholder: {
                                    ProgressView()
                                }
                                .frame(height: 120)
                                .clipped()
                            }
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .navigationBarItems(trailing: Button(action: {
                viewModel.signOut()
            }) {
                Image(systemName: "rectangle.portrait.and.arrow.right")
            })
            .sheet(isPresented: $showingEditProfile) {
                EditProfileView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(image: $selectedImage)
            }
            .onChange(of: selectedImage) { newImage in
                if let image = newImage {
                    viewModel.updateProfileImage(image)
                }
            }
            .onAppear {
                viewModel.fetchUserProfile()
            }
        }
    }
}

struct EditProfileView: View {
    @Environment(\.presentationMode) var presentationMode
    @ObservedObject var viewModel: ProfileViewModel
    @State private var username: String
    @State private var bio: String
    
    init(viewModel: ProfileViewModel) {
        self.viewModel = viewModel
        _username = State(initialValue: viewModel.user?.username ?? "")
        _bio = State(initialValue: viewModel.user?.bio ?? "")
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Profile Information")) {
                    TextField("Username", text: $username)
                    TextField("Bio", text: $bio)
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                },
                trailing: Button("Save") {
                    viewModel.updateProfile(username: username, bio: bio)
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
    }
} 