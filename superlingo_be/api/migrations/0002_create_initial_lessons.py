from django.db import migrations

def create_initial_lessons(apps, schema_editor):
    # api 디렉토리 안의 Lesson 클래스
    Lesson = apps.get_model('api', 'Lesson')

    # --- NEW LESSON 1: Daily Routine ---
    lesson_1_content = {
        "title": "Daily Routine",
        "activities": [
            {
                "type": "MATCHING",
                "title": "Match the pairs",
                "pairs": [
                    ["Wake up", "일어나다"],
                    ["Breakfast", "아침밥"],
                    ["Shower", "샤워"],
                    ["Work", "일하다"]
                ]
            },
            {
                "type": "ORDERING",
                "title": "Put the words in order",
                "prompt": "I eat breakfast",
                "words": ["breakfast", "I", "eat"]
            }
        ]
    }

    # --- NEW LESSON 2: Favorite Food ---
    lesson_2_content = {
        "title": "Favorite Food",
        "activities": [
            {
                "type": "MATCHING",
                "title": "Match the foods",
                "pairs": [
                    ["Pizza", "피자"],
                    ["Taco", "타코"],
                    ["Sushi", "초밥"],
                    ["Salad", "샐러드"]
                ]
            },
            {
                "type": "LISTENING",
                "title": "Choose the correct word",
                "prompt_audio_text": "I like pizza", # Text for Text-to-Speech
                "options": ["Taco", "Pizza", "Salad"],
                "correct_answer": "Pizza"
            }
        ]
    }
    # SQL 쿼리 저장 (ORM), Lesson Object
    Lesson.objects.create(title="Lesson 1 - Daily Routine", level="A1", topics=lesson_1_content)
    Lesson.objects.create(title="Lesson 2 - Favorite Food", level="A1", topics=lesson_2_content)


class Migration(migrations.Migration):
    dependencies = [('api', '0001_initial')]
    operations = [migrations.RunPython(create_initial_lessons)]