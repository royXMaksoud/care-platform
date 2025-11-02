class UserModel {
  final int id;
  final String username;
  final String email;
  final String? phone;
  final String? fullName;
  final String role;
  final List<Permission>? permissions;
  final bool isActive;
  final String? createdAt;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    this.phone,
    this.fullName,
    required this.role,
    this.permissions,
    this.isActive = true,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      phone: json['phone'],
      fullName: json['fullName'],
      role: json['role'],
      permissions: json['permissions'] != null
          ? (json['permissions'] as List)
              .map((p) => Permission.fromJson(p))
              .toList()
          : null,
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'phone': phone,
      'fullName': fullName,
      'role': role,
      'permissions': permissions?.map((p) => p.toJson()).toList(),
      'isActive': isActive,
      'createdAt': createdAt,
    };
  }
}

class Permission {
  final int systemId;
  final String systemName;
  final List<String> permissions;

  Permission({
    required this.systemId,
    required this.systemName,
    required this.permissions,
  });

  factory Permission.fromJson(Map<String, dynamic> json) {
    return Permission(
      systemId: json['systemId'],
      systemName: json['systemName'],
      permissions: List<String>.from(json['permissions']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'systemId': systemId,
      'systemName': systemName,
      'permissions': permissions,
    };
  }
}
