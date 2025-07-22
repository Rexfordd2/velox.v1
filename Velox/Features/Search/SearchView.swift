import SwiftUI

struct SearchView: View {
    @StateObject private var viewModel = SearchViewModel()
    @State private var searchText = ""
    
    var body: some View {
        NavigationView {
            VStack {
                // Search Bar
                SearchBar(text: $searchText, onTextChange: { query in
                    viewModel.searchUsers(query: query)
                })
                .padding()
                
                if viewModel.isLoading {
                    ProgressView()
                } else if searchText.isEmpty {
                    // Show trending or suggested content when search is empty
                    TrendingView()
                } else if viewModel.searchResults.isEmpty {
                    // No results found
                    VStack {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                            .padding()
                        
                        Text("No users found")
                            .font(.headline)
                            .foregroundColor(.gray)
                    }
                } else {
                    // Search Results
                    List(viewModel.searchResults) { user in
                        UserRow(user: user, onFollow: {
                            viewModel.followUser(user)
                        }, onUnfollow: {
                            viewModel.unfollowUser(user)
                        })
                    }
                    .listStyle(PlainListStyle())
                }
            }
            .navigationTitle("Search")
        }
    }
}

struct SearchBar: View {
    @Binding var text: String
    let onTextChange: (String) -> Void
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            
            TextField("Search users", text: $text)
                .onChange(of: text) { newValue in
                    onTextChange(newValue)
                }
            
            if !text.isEmpty {
                Button(action: {
                    text = ""
                    onTextChange("")
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

struct UserRow: View {
    let user: User
    let onFollow: () -> Void
    let onUnfollow: () -> Void
    @State private var isFollowing = false
    
    var body: some View {
        HStack {
            // Profile Image
            if let profileImageURL = user.profileImageURL {
                AsyncImage(url: URL(string: profileImageURL)) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    ProgressView()
                }
                .frame(width: 50, height: 50)
                .clipShape(Circle())
            } else {
                Image(systemName: "person.circle.fill")
                    .resizable()
                    .frame(width: 50, height: 50)
                    .foregroundColor(.gray)
            }
            
            // User Info
            VStack(alignment: .leading, spacing: 4) {
                Text(user.username)
                    .font(.headline)
                
                if let bio = user.bio {
                    Text(bio)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            // Follow Button
            Button(action: {
                isFollowing.toggle()
                if isFollowing {
                    onFollow()
                } else {
                    onUnfollow()
                }
            }) {
                Text(isFollowing ? "Following" : "Follow")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(isFollowing ? .primary : .white)
                    .frame(width: 100, height: 30)
                    .background(isFollowing ? Color(.systemGray5) : Color.blue)
                    .cornerRadius(15)
            }
        }
        .padding(.vertical, 8)
    }
}

struct TrendingView: View {
    var body: some View {
        VStack(spacing: 20) {
            Text("Trending")
                .font(.title2)
                .fontWeight(.bold)
            
            // Add trending content here
            Text("Coming soon...")
                .foregroundColor(.gray)
        }
        .padding()
    }
} 