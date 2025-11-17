
import { Book, BookStatus, BookFormat } from './book.js';


const bookForm = document.getElementById('addBookForm') as HTMLFormElement;
const bookListContainer = document.getElementById('bookListContainer') as HTMLDivElement;
const emptyMessage = document.getElementById('emptyMessage') as HTMLParagraphElement;
const totalBooksFinishedEl = document.getElementById('totalBooksFinished') as HTMLParagraphElement;
const totalPagesReadEl = document.getElementById('totalPagesRead') as HTMLParagraphElement;


let myLibrary: Book[] = [];



async function loadBooks(): Promise<void> {
    try {
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error("Failed to fetch books");
        const booksFromDB: any[] = await response.json();
        
        
        myLibrary = booksFromDB.map(b => new Book(
            b.title, b.author, b.numberOfPages, b.status, b.price,
            b.pagesRead, b.format, b.suggestedBy, b.id
        ));
        
        renderLibrary();
        updateGlobalStats();
    } catch (err) {
        console.error("Error loading books:", err);
        bookListContainer.innerHTML = `<p class="text-red-500">Error loading books. Is the server running?</p>`;
    }
}


async function addNewBook(e: Event): Promise<void> {
    e.preventDefault();
    const formData = new FormData(bookForm);

    const pagesRead = Number(formData.get('pagesRead'));
    const totalPages = Number(formData.get('numberOfPages'));

    if (pagesRead > totalPages) {
        alert("'Pages Read' cannot be greater than 'Total Pages'.");
        return;
    }
    
   
    const newBookData = {
        title: formData.get('title') as string,
        author: formData.get('author') as string,
        numberOfPages: totalPages,
        status: formData.get('status') as BookStatus,
        price: Number(formData.get('price')),
        pagesRead: pagesRead,
        format: formData.get('format') as BookFormat,
        suggestedBy: formData.get('suggestedBy') as string,
    };
    
    try {
        const response = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBookData)
        });
        
        if (!response.ok) throw new Error("Failed to save book");
        
        const savedBook = await response.json();
        
       
        myLibrary.push(new Book(
             savedBook.title, savedBook.author, savedBook.numberOfPages, savedBook.status,
             savedBook.price, savedBook.pagesRead, savedBook.format, savedBook.suggestedBy, savedBook.id
        ));
        
        renderLibrary();
        updateGlobalStats();
        bookForm.reset();
        
    } catch (err) {
        console.error("Error saving book:", err);
        alert("Error saving book. See console for details.");
    }
}


async function updateBookPages(bookId: string, newPagesRead: string): Promise<void> {
    const book = myLibrary.find(b => b.id === bookId);
    if (!book) return;


    book.updatePagesRead(Number(newPagesRead)); 

   
    const updateData = {
        pagesRead: book.pagesRead,
        finished: book.finished,
        status: book.status
    };

    try {
        await fetch(`/api/books/${book.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        
        renderLibrary();
        updateGlobalStats();

    } catch (err) {
        console.error("Error updating book:", err);
    }
}


async function deleteBook(bookId: string): Promise<void> {
    const book = myLibrary.find(b => b.id === bookId);
    if (!book) return;
    
    book.deleteBook(); 
    
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) {
        return;
    }

    try {
        await fetch(`/api/books/${book.id}`, { method: 'DELETE' });
        
        
        myLibrary = myLibrary.filter(b => b.id !== bookId);
        renderLibrary();
        updateGlobalStats();
        
    } catch (err) {
        console.error("Error deleting book:", err);
    }
}




function renderLibrary(): void {
    bookListContainer.innerHTML = '';

    if (myLibrary.length === 0) {
        bookListContainer.appendChild(emptyMessage);
        return;
    }

    myLibrary.forEach(book => {
        const percentage = book.currentlyAt();
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-lg shadow-md flex flex-col space-y-3';
        card.setAttribute('data-book-id', book.id);

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-semibold">${book.title}</h3>
                    <p class="text-sm text-gray-600">by ${book.author}</p>
                </div>
                <button data-action="delete" class="text-red-500 hover:text-red-700 font-medium">X</button>
            </div>
            
            <div>
                <span class="text-sm font-medium">Progress: ${percentage}%</span>
                <span class="text-sm text-gray-500">(${book.pagesRead} / ${book.numberOfPages} pages)</span>
                <div class="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>

            <div class="flex items-center space-x-2 pt-2">
                <label for="pagesInput-${book.id}" class="text-sm">Update Pages:</label>
                <input type="number" id="pagesInput-${book.id}" min="0" max="${book.numberOfPages}" 
                       class="block w-24 rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="${book.pagesRead}">
                <button data-action="update-pages" class="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">Update</button>
            </div>

            <div class="flex justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                <span>Status: <strong class="text-gray-700">${book.status}</strong></span>
                <span>Format: <strong class="text-gray-700">${book.format}</strong></span>
            </div>
        `;
        bookListContainer.appendChild(card);
    });
}


function updateGlobalStats(): void {
    const finishedBooks: Book[] = myLibrary.filter(book => book.finished);
    const totalPages: number = myLibrary.reduce((sum, book) => sum + book.pagesRead, 0);

    totalBooksFinishedEl.textContent = finishedBooks.length.toString();
    totalPagesReadEl.textContent = totalPages.toLocaleString();
}


function handleListClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    const bookCard = target.closest<HTMLDivElement>('[data-book-id]');
    const bookId = bookCard?.dataset.bookId;

    if (!bookId || !action) return;

    if (action === 'delete') {
        deleteBook(bookId);
    }

    if (action === 'update-pages') {
        const pagesInput = bookCard.querySelector<HTMLInputElement>(`#pagesInput-${bookId}`);
        if (pagesInput && pagesInput.value !== "") {
            updateBookPages(bookId, pagesInput.value);
        }
    }
}

bookForm.addEventListener('submit', addNewBook);
bookListContainer.addEventListener('click', handleListClick);


loadBooks();