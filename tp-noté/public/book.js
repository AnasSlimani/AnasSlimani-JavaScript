export var BookStatus;
(function (BookStatus) {
    BookStatus["Read"] = "Read";
    BookStatus["ReRead"] = "Re-read";
    BookStatus["DNF"] = "DNF";
    BookStatus["CurrentlyReading"] = "Currently reading";
    BookStatus["ReturnedUnread"] = "Returned Unread";
    BookStatus["WantToRead"] = "Want to read";
})(BookStatus || (BookStatus = {}));
export var BookFormat;
(function (BookFormat) {
    BookFormat["Print"] = "Print";
    BookFormat["PDF"] = "PDF";
    BookFormat["Ebook"] = "Ebook";
    BookFormat["AudioBook"] = "AudioBook";
})(BookFormat || (BookFormat = {}));
export class Book {
    constructor(title, author, numberOfPages, status, price, pagesRead, format, suggestedBy, id) {
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
    currentlyAt() {
        if (this.numberOfPages === 0) {
            return this.finished ? 100 : 0;
        }
        const percentage = (this.pagesRead / this.numberOfPages) * 100;
        return Math.round(percentage);
    }
    updatePagesRead(newPagesRead) {
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
        }
        else {
            this.finished = false;
            if (this.status === BookStatus.Read) {
                this.status = BookStatus.CurrentlyReading;
            }
        }
    }
    deleteBook() {
        console.log(`Deletion requested for: ${this.title}`);
    }
}
