# Инструкция по настройке Supabase Storage для Skillflow

Если вы видите ошибку **"Bucket not found"** или **"Не удалось загрузить файл"**, вам необходимо вручную настроить хранилище в панели управления Supabase.

## Шаг 1: Создание бакета
1. Перейдите в [Supabase Dashboard](https://supabase.com).
2. Выберите ваш проект.
3. В левом меню выберите **Storage**.
4. Нажмите **New Bucket**.
5. Введите имя: `chat_attachments`.
6. Переключите тумблер **Public bucket** в положение ВКЛ (это важно для отображения изображений другим пользователям).
7. Нажмите **Create bucket**.

## Шаг 2: Настройка политик доступа (Policies)
Чтобы пользователи могли загружать файлы, нужно добавить разрешения:
1. Выберите созданный бакет `chat_attachments`.
2. Нажмите вкладку **Policies**.
3. Нажмите **New Policy** -> **Get started quickly**.
4. Выберите шаблон **"Enable read access for all users"** (разрешить всем просмотр). Нажмите `Review` -> `Save policy`.
5. Снова нажмите **New Policy** -> **Get started quickly**.
6. Выберите шаблон **"Enable insert access for authenticated users only"** (разрешить загрузку только авторизованным). Нажмите `Review` -> `Save policy`.
7. (Опционально) Можно добавить политику для удаления своих файлов пользователями.

## Шаг 2: Настройка через SQL (САМЫЙ НАДЕЖНЫЙ СПОСОБ)
Если ручное создание не помогло или вы хотите сделать всё сразу, скопируйте этот код полностью и выполните его в **SQL Editor** в Supabase:

```sql
-- 1. Создаем бакет 'chat_attachments', если его нет
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Удаляем старые политики, чтобы избежать конфликтов
DROP POLICY IF EXISTS "Public Access for chat_attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for chat_attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete for chat_attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- 3. Создаем новые политики доступа
-- Просмотр для всех
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat_attachments' );

-- Загрузка для авторизованных
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat_attachments' );

-- Удаление своих файлов (простая версия для надежности)
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'chat_attachments' );
```

## Почему это происходит?
Приложение пытается создать бакет автоматически, но это часто блокируется настройками безопасности Supabase, если вы используете стандартный API ключ (Anon Key). Ручное создание бакета гарантирует стабильную работу чата и портфолио.

---
*Остальные настройки базы данных (таблицы и функции) должны быть уже настроены через SQL редактор.*
