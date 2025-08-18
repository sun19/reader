use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Book {
    id: String,
    title: String,
    author: String,
    file_path: String,
    file_type: String,
    cover_data: Option<String>, // Base64编码的封面数据
    last_read: Option<String>,
    created_at: String,
    last_read_position:String,
    reading_percentage:String,
    current_chapter:String,
}

#[derive(Debug, Serialize, Deserialize)]
struct BookData {
    title: String,
    author: String,
    file_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct BookSearchResult {
    title: String,
    author: String,
    cover_url: Option<String>,
    description: Option<String>,
}

type LibraryState = Mutex<HashMap<String, Book>>;

/**
 * 从EPUB文件中提取元数据
 */
fn extract_epub_metadata(file_path: &str) -> Result<(String, String, Option<String>), String> {
    let mut doc = epub::doc::EpubDoc::new(file_path)
        .map_err(|e| format!("无法打开EPUB文件: {}", e))?;
    
    let title = doc.mdata("title")
        .unwrap_or_else(|| "未知标题".to_string());
    
    let author = doc.mdata("creator")
        .or_else(|| doc.mdata("author"))
        .unwrap_or_else(|| "未知作者".to_string());
    
    // 尝试提取封面
    let cover_data = extract_epub_cover(&mut doc);
    
    Ok((title, author, cover_data))
}

/**
 * 从EPUB文件中提取封面
 */
fn extract_epub_cover(doc: &mut epub::doc::EpubDoc<std::io::BufReader<std::fs::File>>) -> Option<String> {
    // 尝试获取封面图片
    if let Some((cover_data, _)) = doc.get_cover() {
        // 使用新的base64 API将图片数据转换为base64
        let base64_data = general_purpose::STANDARD.encode(&cover_data);
        return Some(format!("data:image/jpeg;base64,{}", base64_data));
    }
    None
}


/**
 * 添加书籍到书库（增强版）
 */
#[tauri::command]
async fn get_book_info(book_data: BookData) -> Result<Book, String> {
    // 验证文件是否存在
    let file_path = PathBuf::from(&book_data.file_path);
    if !file_path.exists() {
        return Err("文件不存在".to_string());
    }
    
    // 验证文件格式
    let file_type = match file_path.extension().and_then(|s| s.to_str()) {
        Some("txt") => "txt".to_string(),
        Some("epub") => "epub".to_string(),
        Some("mobi") => "mobi".to_string(),
        _ => return Err("不支持的文件格式".to_string()),
    };
    
    let mut title = book_data.title;
    let mut author = book_data.author;
    let mut cover_data: Option<String> = None;

    // 如果是EPUB文件，尝试提取元数据
    if file_type == "epub" {
        match extract_epub_metadata(&book_data.file_path) {
            Ok((epub_title, epub_author, epub_cover)) => {
                if title == "未知标题" || title.is_empty() {
                    title = epub_title;
                }
                if author == "未知作者" || author.is_empty() {
                    author = epub_author;
                }
                cover_data = epub_cover;
            }
            Err(e) => {
                println!("提取EPUB元数据失败: {}", e);
            }
        }
    }
    
    // 生成唯一ID
    let id = uuid::Uuid::new_v4().to_string();
    
    // 创建书籍对象
    let book = Book {
        id: id.clone(),
        title,
        author,
        file_path: book_data.file_path,
        file_type,
        cover_data,
        last_read: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        last_read_position:String::new(),
        reading_percentage:String::new(),
        current_chapter:String::new(),
    };
    
    Ok(book)
}



/**
 * 读取文件为字节数组
 */
#[tauri::command]
fn read_file_bytes(file_path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&file_path)
        .map_err(|e| format!("读取文件失败: {}", e))
}

/**
 * 写入文本文件
 */
#[tauri::command]
fn write_text_file(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content)
        .map_err(|e| format!("写入文件失败: {}", e))
}

/**
 * 写入二进制文件
 */
#[tauri::command]
fn write_binary_file(file_path: String, data: Vec<u8>) -> Result<(), String> {
    std::fs::write(&file_path, data)
        .map_err(|e| format!("写入文件失败: {}", e))
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(LibraryState::default())
        .invoke_handler(tauri::generate_handler![
            get_book_info,
            read_file_bytes,
            write_text_file,
            write_binary_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}