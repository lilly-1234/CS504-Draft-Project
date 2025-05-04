import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Button,
  Grid, Card, CardContent, CardActions, Chip, Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [editNoteId, setEditNoteId] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // ✅ Auto-fetch notes on load
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes', {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (Array.isArray(data)) setNotes(data);
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };
    fetchNotes();
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleAddOrUpdateNote = async () => {
    if (!title || !content) return;

    const note = {
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
    };

    try {
      const res = await fetch(`/api/notes${editNoteId ? `/${editNoteId}` : ''}`, {
        method: editNoteId ? 'PUT' : 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(note),
      });
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

  const handleEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags.join(', '));
    setEditNoteId(note._id);
  };

  const handleDelete = async (noteId) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (res.ok) {
        setNotes(notes.filter(n => n._id !== noteId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredNotes = searchTag
    ? notes.filter(note => note.tags.includes(searchTag))
    : notes;

  return (
    <Container>
      {/* Logout bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" my={2}>
        <Typography variant="h4">Secure Notes Dashboard</Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {/* Note editor */}
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

      {/* Notes list */}
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
      </Grid>
    </Container>
  );
};

export default Dashboard;
