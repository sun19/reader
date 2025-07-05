export default class BookData {
  // 本地存储相关的常量
  static STORAGE_KEY = "reader_books";

  /**
   * 保存书籍数据到本地存储
   * @param {Array} books 书籍数据数组
   */
  static saveBooks(books) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(books));
  }

  /**
   * 从本地存储获取书籍数据
   * @returns {Array} 书籍数据数组
   */
  static getBooks() {
    const booksStr = localStorage.getItem(this.STORAGE_KEY);
    return booksStr ? JSON.parse(booksStr) : [];
  }

  /**
   * 清除本地存储中的书籍数据
   */
  static clearBooks() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 添加单本书籍到本地存储
   * @param {Object} book 书籍对象
   */
  static addBook(book) {
    const books = this.getBooks();
    books.push(book);
    this.saveBooks(books);
  }

  /**
   * 从本地存储删除指定书籍
   * @param {string} bookId 书籍ID
   */
  static removeBook(bookId) {
    const books = this.getBooks();
    const filteredBooks = books.filter((book) => book.id !== bookId);
    this.saveBooks(filteredBooks);
  }

  /**
   * 更新本地存储中的书籍数据
   * @param {Object} book 书籍对象
   */
  static updateBook(book) {
    const books = this.getBooks();
    const index = books.findIndex((b) => b.id === book.id);
    if (index !== -1) {
      books[index] = book;
      this.saveBooks(books);
    }
  }

  /**
   * 根据ID获取书籍
   * @param {string} bookId 书籍ID
   * @returns {Object} 书籍对象
   */
  static getBookById(bookId) {
    const books = this.getBooks();
    return books.find((book) => book.id === bookId);
  }
}
