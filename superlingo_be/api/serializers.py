from rest_framework import serializers
from .models import User, Lesson

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # FIX: Added 'email' to the list of fields.
        fields = ('id', 'username', 'password', 'email')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Using create_user ensures the password is properly hashed.
        # FIX: This now correctly handles the email field.
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''), # Use .get for safety
            password=validated_data['password']
        )
        return user

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'