
export enum BookStatus {
    Read = "Read",
    ReRead = "Re-read",
    DNF = "DNF",
    CurrentlyReading = "Currently reading",
    ReturnedUnread = "Returned Unread",
    WantToRead = "Want to read"
}

export enum BookFormat {
    Print = "Print",
    PDF = "PDF",
    Ebook = "Ebook",
    AudioBook = "AudioBook"
}

export class Book {
    id: string; 
    title: string;
    author: string;
    numberOfPages: number;
    status: BookStatus;
    price: number;
    pagesRead: number;
    format: BookFormat;
    suggestedBy: string;
    finished: boolean;

    constructor(
        title: string,
        author: string,
        numberOfPages: number,
        status: BookStatus,
        price: number,
        pagesRead: number,
        format: BookFormat,
        suggestedBy: string,
       
        id: string 
    ) {
        this.id = id; 
        this.title = title;
        this.author = author;
        this.numberOfPages = numberOfPages;
        this.status = status;
        this.price = price;
        this.pagesRead = pagesRead;
        this.format = format;
        this.suggestedBy = suggestedBy;
        this.finished = (this.pagesRead === this.numberOfPages);
    }

    currentlyAt(): number {
        if (this.numberOfPages === 0) {
            return this.finished ? 100 : 0;
        }
        const percentage = (this.pagesRead / this.numberOfPages) * 100;
        return Math.round(percentage);
    }

    updatePagesRead(newPagesRead: number): void {
        this.pagesRead = newPagesRead;

        if (this.pagesRead > this.numberOfPages) {
            this.pagesRead = this.numberOfPages;
        }
        if (this.pagesRead < 0) {
            this.pagesRead = 0;
        }

        if (this.pagesRead === this.numberOfPages) {
            this.finished = true;
            this.status = BookStatus.Read;
        } else {
            this.finished = false;
            if (this.status === BookStatus.Read) {
                this.status = BookStatus.CurrentlyReading;
            }
        }
    }
 
    deleteBook(): void {
        console.log(`Deletion requested for: ${this.title}`);
    }
}