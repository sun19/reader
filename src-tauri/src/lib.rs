use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;
use std::sync::Mutex;
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Book {
    id: String,
    title: String,
    author: String,
    file_path: String,
    file_type: String,
    cover_url: Option<String>,
    cover_data: Option<String>, // Base64编码的封面数据
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
 * 通过网络API查询书籍信息
 */
async fn search_book_online(title: &str) -> Result<BookSearchResult, String> {
    let client = reqwest::Client::new();
    
    // 使用豆瓣API查询书籍信息（示例）
    let search_url = format!(
        "https://api.douban.com/v2/book/search?q={}&count=1",
        urlencoding::encode(title)
    );
    
    let response = client
        .get(&search_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;
    
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;
    
    if let Some(books) = json["books"].as_array() {
        if let Some(book) = books.first() {
            let title = book["title"].as_str().unwrap_or("未知标题").to_string();
            let author = book["author"]
                .as_array()
                .and_then(|authors| authors.first())
                .and_then(|author| author.as_str())
                .unwrap_or("未知作者")
                .to_string();
            let cover_url = book["image"].as_str().map(|s| s.to_string());
            let description = book["summary"].as_str().map(|s| s.to_string());
            
            return Ok(BookSearchResult {
                title,
                author,
                cover_url,
                description,
            });
        }
    }
    
    Err("未找到相关书籍信息".to_string())
}

/**
 * 获取书库列表
 */
#[tauri::command]
fn get_library(library: State<LibraryState>) -> Result<Vec<Book>, String> {
    let library = library.lock().map_err(|e| e.to_string())?;
    Ok(library.values().cloned().collect())
}

/**
 * 添加书籍到书库（增强版）
 */
#[tauri::command]
async fn add_book(book_data: BookData, library: State<'_, LibraryState>) -> Result<Book, String> {
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
    
    let mut title = book_data.title;
    let mut author = book_data.author;
    let mut cover_data: Option<String> = None;
    let mut cover_url: Option<String> = None;
    
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
    
    // 如果仍然缺少作者或封面信息，尝试在线查询
    if (author == "未知作者" || author.is_empty()) || cover_data.is_none() {
        match search_book_online(&title).await {
            Ok(search_result) => {
                if author == "未知作者" || author.is_empty() {
                    author = search_result.author;
                }
                if cover_data.is_none() {
                    cover_url = search_result.cover_url;
                }
            }
            Err(e) => {
                println!("在线查询书籍信息失败: {}", e);
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
        cover_url,
        cover_data,
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

/**
 * 读取书籍内容（支持TXT和EPUB格式）
 */
#[tauri::command]
fn read_book_content(file_path: String) -> Result<String, String> {
    let path = std::path::Path::new(&file_path);
    
    // 根据文件扩展名判断文件类型
    match path.extension().and_then(|s| s.to_str()) {
        Some("epub") => read_epub_content(&file_path),
        Some("txt") => read_txt_content(&file_path),
        _ => Err("不支持的文件格式".to_string()),
    }
}

/**
 * 读取TXT文件内容
 */
fn read_txt_content(file_path: &str) -> Result<String, String> {
    // 读取原始字节
    let bytes = std::fs::read(file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;
    
    // 使用lossy转换，会将无效的UTF-8字符替换为�
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

/**
 * 读取EPUB文件内容（简化版）
 */
fn read_epub_content(file_path: &str) -> Result<String, String> {
    let mut doc = epub::doc::EpubDoc::new(file_path)
        .map_err(|e| format!("无法打开EPUB文件: {}", e))?;
    
    let mut all_content = String::new();
    let html_tag_regex = regex::Regex::new(r"<[^>]*>").unwrap();

    // 将资源ID收集到Vec中，避免同时借用doc
    let resource_ids: Vec<String> = doc.resources.keys().cloned().collect();

    // 遍历所有资源
    for id in resource_ids {
        // 确保 get_resource_str 返回的是 Option<(String, String)>，并正确解构
        if let Some((content, _)) = doc.get_resource_str(&id) {
            // 简单的HTML标签移除
            let clean_content = content
                .replace("<p>", "\n")
                .replace("</p>", "\n")
                .replace("<br>", "\n")
                .replace("<br/>", "\n")
                .replace("<div>", "\n")
                .replace("</div>", "\n");
            
            // 移除所有HTML标签
            let text_only = html_tag_regex.replace_all(&clean_content, "").to_string();
            
            all_content.push_str(&text_only);
            all_content.push_str("\n\n");
        }
    }
    
    Ok(all_content)
}

/**
 * 获取单本书籍信息
 */
#[tauri::command]
fn get_book(book_id: String, library: State<LibraryState>) -> Result<Book, String> {
    let library = library.lock().map_err(|e| e.to_string())?;
    library.get(&book_id)
        .cloned()
        .ok_or_else(|| "书籍不存在".to_string())
}

/**
 * 保存阅读进度
 */
#[tauri::command]
fn save_reading_progress(_book_id: String, _chapter: usize, _page: usize, _library: State<LibraryState>) -> Result<(), String> {
    // 这里可以保存到文件或数据库
    println!("保存进度: 书籍{}, 章节{}, 页面{}", _book_id, _chapter, _page);
    Ok(())
}

/**
 * 获取阅读进度
 */
#[tauri::command]
fn get_reading_progress(_book_id: String) -> Result<Option<serde_json::Value>, String> {
    // 这里应该从文件或数据库读取进度
    // 暂时返回空，实际项目中需要实现持久化
    Ok(None)
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
            update_book_progress,
            read_book_content,
            get_book,
            save_reading_progress,
            get_reading_progress
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}