// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "Velox",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "Velox",
            targets: ["Velox"]),
    ],
    dependencies: [
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "10.0.0"),
        .package(url: "https://github.com/SDWebImage/SDWebImage.git", from: "5.0.0")
    ],
    targets: [
        .target(
            name: "Velox",
            dependencies: [
                .product(name: "FirebaseAuth", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFirestore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseStorage", package: "firebase-ios-sdk"),
                .product(name: "SDWebImage", package: "SDWebImage")
            ]),
        .testTarget(
            name: "VeloxTests",
            dependencies: ["Velox"]),
    ]
) 