import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Button,
  Grid, Card, CardContent, CardActions, Chip, Stack, Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Dashboard = ({setIsAuthenticated}) => {
  // State variables for managing notes, search and user
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [editNoteId, setEditNoteId] = useState(null);
  const [username, setUsername] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); // Grabs the JWT token saved during login

  // Fetch stored username
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  // Auto logout if token is expired
  useEffect(() => {
    if (token) {
      try {
        const { exp } = jwtDecode(token); // Get expiration from JWT
        const now = Date.now();
        // If Token is expired, clear the storage and send an alert massage and redirect to login
        if (now >= exp * 1000) { 
          localStorage.clear();
          alert("Session expired. Please log in again");
        } else {
          // Schedule auto logout when token will expire
          const timeout = exp * 1000 - now;
          const logoutTimer = setTimeout(() => {
            localStorage.clear();
            alert("Session expired. Please log in again");
            navigate("/login");
          }, timeout);
          // Cleanup on component unmount 
          return () => clearTimeout(logoutTimer);
        }
      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.clear();
        navigate("/login");
      }
    }
  }, [token, navigate]);

  // Fetch all notes on page load
  useEffect(() => {
    // Fetching the notes from the backend
    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes', {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.status === 403) { // If The token is missing, invalid, or expired
          localStorage.clear();
          alert("Session expired. Please log in again");
          navigate('/login');
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) setNotes(data);
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };
    fetchNotes();
  }, [token, navigate]);

  // Logout function
  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    navigate('/login');
  };
  // Create or update a note
  const handleAddOrUpdateNote = async () => {
    if (!title || !content)  {
      setSnackbar({ open: true, message: "Please fill in all required fields" });
      return;
    }

    const note = {
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),  // convert comma-separated to array
    };

    try {
      // Sends the note to the backend using the fetch() API
      const res = await fetch(`/api/notes${editNoteId ? `/${editNoteId}` : ''}`, {
        method: editNoteId ? 'PUT' : 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(note),
      });

      if (res.status === 403) { // If the token is invalid or expired, the server returns 
        localStorage.clear();
        alert("Session expired. Please log in again");
        setIsAuthenticated(false);
        navigate("/login");
        return;
      }

      const result = await res.json();

      if (res.ok) {
        if (editNoteId) {
          setNotes(notes.map(n => (n._id === editNoteId ? result : n)));
        } else {
          setNotes([...notes, result]);
        }
        setTitle('');
        setContent('');
        setTags('');
        setEditNoteId(null);
      }
    } catch (err) {
      console.error("Save note error:", err);
    }
  };
  // Function to edit the note
  const handleEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags.join(', '));
    setEditNoteId(note._id);
  };

  // Function to remove the note
  const handleDelete = async (noteId) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (res.status === 403) {
        localStorage.clear();
        alert("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (res.ok) {
        setNotes(notes.filter(n => n._id !== noteId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Filtering Notes by tags
  const filteredNotes = searchTag
    ? notes.filter(note => note.tags.includes(searchTag))
    : notes;
  
  // Function to handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleGoToMFA = () => {
  navigate('/mfa-setup', { state: { username } });  // username from state or decoded token
};

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" my={2}> 
      <Box>
        <Typography variant="h4">Secure Notes</Typography>
        {username && (
          <Typography variant="subtitle1" >
            Hello, {username}
          </Typography>
        )}
        <Box className="action-buttons">
          <Button variant="outlined" onClick={handleLogout}> Logout </Button>
          <Button variant="outlined" onClick={handleGoToMFA}> MFA Scan </Button> 
        </Box>
      </Box>
      </Box>


      <Box mb={3}>
        <Stack spacing={2}>
          <TextField label="Title" fullWidth value={title} onChange={e => setTitle(e.target.value)} />
          <TextField label="Content" fullWidth multiline rows={3} value={content} onChange={e => setContent(e.target.value)} />
          <TextField label="Tags (comma separated)" fullWidth value={tags} onChange={e => setTags(e.target.value)} />
          <Button variant="contained" color="primary" onClick={handleAddOrUpdateNote}>
            {editNoteId ? 'Update Note' : 'Add Note'}
          </Button>
        </Stack>
      </Box>

      <TextField
        label="Search by Tag"
        fullWidth
        value={searchTag}
        onChange={e => setSearchTag(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={2}>
        {filteredNotes.map((note) => (
          <Grid item xs={12} sm={6} md={4} key={note._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{note.title}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{note.content}</Typography>
                <Box mt={1}>
                  {note.tags.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleEdit(note)}>Edit</Button>
                <Button size="small" color="error" onClick={() => handleDelete(note._id)}>Delete</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
      {/* Snackbar for messages */}
      <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
        />
  </Grid>
  </Container>
  );
}
  

export default Dashboard;
