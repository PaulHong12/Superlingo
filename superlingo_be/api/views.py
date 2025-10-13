# In api/views.py

from django.contrib.auth import authenticate
from django.http import FileResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import Lesson
from .serializers import UserSerializer, LessonSerializer
import torch
from TTS.api import TTS
import os
import uuid
import threading

# --- GLOBAL VARIABLES (Required for stability) ---
tts_model = None
device = "cuda" if torch.cuda.is_available() else "cpu"
model_lock = threading.Lock()


# --- AUTHENTICATION VIEWS (No Changes) ---
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    user = authenticate(username=request.data.get('username'), password=request.data.get('password'))
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})
    return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)


# --- AUDIO GENERATION VIEW (THE FIX) ---
@api_view(['POST'])
def generate_audio(request):
    global tts_model

    text = request.data.get('text', '')
    if not text:
        return Response({'error': 'No text provided'}, status=status.HTTP_400_BAD_REQUEST)

    filepath = f"{uuid.uuid4()}.wav"
    if os.path.exists(filepath):
            os.remove(filepath)
            
    try:
        # Thread-safe model loading
        with model_lock:
            if tts_model is None:
                print("Loading TTS model for the first time...")
                tts_model = TTS("tts_models/en/ljspeech/tacotron2-DDC").to(device)
                print("TTS model loaded.")

        # --- THE FINAL, SIMPLE FIX ---
        # This model is single-speaker and does not take speaker/language arguments.
        # This is the direct and correct way to call it.
        tts_model.tts_to_file(text=text, file_path=filepath)

        if os.path.exists(filepath):
            return FileResponse(open(filepath, 'rb'), content_type='audio/wav')
        else:
            raise FileNotFoundError("TTS failed to create the audio file.")

    except Exception as e:
        print(f"FATAL Error during TTS generation: {e}")
        return Response({'error': 'Audio file could not be generated.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    finally:
        # Critical cleanup to prevent server from filling up
        if os.path.exists(filepath):
            os.remove(filepath)


# --- LESSON VIEWSET (No Changes) ---
class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Lesson.objects.all().order_by('id')
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]