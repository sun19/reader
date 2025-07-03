use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Book {
    id: String,
    title: String,
    author: String,
    file_path: String,
    file_type: String,
    cover_url: Option<String>,
    progress: f32,
    last_read: Option<String>,
    created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct BookData {
    title: String,
    author: String,
    file_path: String,
}

type LibraryState = Mutex<HashMap<String, Book>>;

/**
 * 获取书库列表
 */
#[tauri::command]
fn get_library(library: State<LibraryState>) -> Result<Vec<Book>, String> {
    let library = library.lock().map_err(|e| e.to_string())?;
    Ok(library.values().cloned().collect())
}

/**
 * 添加书籍到书库
 */
#[tauri::command]
fn add_book(book_data: BookData, library: State<LibraryState>) -> Result<Book, String> {
    // 验证文件是否存在
    let file_path = PathBuf::from(&book_data.file_path);
    if !file_path.exists() {
        return Err("文件不存在".to_string());
    }
    
    // 验证文件格式
    let file_type = match file_path.extension().and_then(|s| s.to_str()) {
        Some("txt") => "txt".to_string(),
        Some("epub") => "epub".to_string(),
        _ => return Err("不支持的文件格式".to_string()),
    };
    
    // 生成唯一ID
    let id = uuid::Uuid::new_v4().to_string();
    
    // 创建书籍对象
    let book = Book {
        id: id.clone(),
        title: book_data.title,
        author: book_data.author,
        file_path: book_data.file_path,
        file_type,
        cover_url: None,
        progress: 0.0,
        last_read: None,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    
    // 添加到书库
    let mut library = library.lock().map_err(|e| e.to_string())?;
    library.insert(id, book.clone());
    
    Ok(book)
}

/**
 * 从书库移除书籍
 */
#[tauri::command]
fn remove_book(book_id: String, library: State<LibraryState>) -> Result<(), String> {
    let mut library = library.lock().map_err(|e| e.to_string())?;
    library.remove(&book_id);
    Ok(())
}

/**
 * 更新书籍阅读进度
 */
#[tauri::command]
fn update_book_progress(book_id: String, progress: f32, library: State<LibraryState>) -> Result<(), String> {
    let mut library = library.lock().map_err(|e| e.to_string())?;
    if let Some(book) = library.get_mut(&book_id) {
        book.progress = progress;
        book.last_read = Some(chrono::Utc::now().to_rfc3339());
    }
    Ok(())
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(LibraryState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_library,
            add_book,
            remove_book,
            update_book_progress
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}