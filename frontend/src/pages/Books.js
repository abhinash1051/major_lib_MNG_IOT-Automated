import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    barcode: '',
    totalCopies: 1,
    availableCopies: 1,
    location: {
      shelf: '',
      row: '',
      column: ''
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/books`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBooks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching books:', error);
      setLoading(false);
      
      // For demo purposes, set sample data
      // Fallback demo data can be added here if needed
      setBooks([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (editingId) {
        // Update existing book
        await axios.put(`${process.env.REACT_APP_API_URL}/books/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSuccess('Book updated successfully!');
      } else {
        // Create new book
        await axios.post(`${process.env.REACT_APP_API_URL}/books`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSuccess('Book added successfully!');
      }
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        barcode: '',
        totalCopies: 1,
        availableCopies: 1,
        location: {
          shelf: '',
          row: '',
          column: ''
        }
      });
      setEditingId(null);
      setShowForm(false);
      
      // Refresh book list
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      setError(error.response?.data?.message || 'Error saving book data');
    }
  };

  const handleEdit = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      barcode: book.barcode,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      location: {
        shelf: book.location.shelf,
        row: book.location.row,
        column: book.location.column
      }
    });
    setEditingId(book._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/books/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSuccess('Book deleted successfully!');
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
        setError(error.response?.data?.message || 'Error deleting book');
      }
    }
  };





  // Filter books based on search term
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Books Management</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                title: '',
                author: '',
                isbn: '',
                barcode: '',
                totalCopies: 1,
                availableCopies: 1,
                location: {
                  shelf: '',
                  row: '',
                  column: ''
                }
              });
            }}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : 'Add Book'}
          </button>

        </div>
      </div>

      {/* Error and Success Messages */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      {/* Book Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Book' : 'Add New Book'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="author">Author</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="isbn">ISBN</label>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="barcode">Barcode</label>
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="totalCopies">Total Copies</label>
                <input
                  type="number"
                  id="totalCopies"
                  name="totalCopies"
                  value={formData.totalCopies}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="availableCopies">Available Copies</label>
                <input
                  type="number"
                  id="availableCopies"
                  name="availableCopies"
                  value={formData.availableCopies}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max={formData.totalCopies}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location.shelf">Shelf</label>
                <input
                  type="text"
                  id="location.shelf"
                  name="location.shelf"
                  value={formData.location.shelf}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location.row">Row</label>
                <input
                  type="text"
                  id="location.row"
                  name="location.row"
                  value={formData.location.row}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location.column">Column</label>
                <input
                  type="text"
                  id="location.column"
                  name="location.column"
                  value={formData.location.column}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Book' : 'Add Book'}
              </button>
            </div>
          </form>
        </div>
      )}


      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search books by title, author, ISBN or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input w-full"
        />
      </div>

      {/* Books Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copies</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">No books found</td>
              </tr>
            ) : (
              filteredBooks.map((book) => (
                <tr key={book._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{book.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.author}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.isbn}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.barcode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{book.availableCopies} / {book.totalCopies}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          book.availableCopies === 0 ? 'bg-red-600' : 
                          book.availableCopies < book.totalCopies / 2 ? 'bg-yellow-400' : 'bg-green-600'
                        }`}
                        style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Shelf {book.location.shelf}, Row {book.location.row}, Cell {book.location.column}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.location.department || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(book)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(book._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Books;