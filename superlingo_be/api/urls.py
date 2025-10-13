from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import register_user, login_user, generate_audio, LessonViewSet

router = DefaultRouter()
router.register(r'lessons', LessonViewSet, basename='lesson')

urlpatterns = [
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('generate-audio/', generate_audio, name='generate-audio'),
    path('', include(router.urls)),
]