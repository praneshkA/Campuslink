import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Grid, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, IconButton, Alert, CircularProgress // Removed Switch, FormControlLabel
} from '@mui/material';
import { Add, Delete, Visibility, Poll as PollIcon, CheckCircle, Cancel } from '@mui/icons-material';
import { pollApi } from '../api/pollApi';

const PollManagement = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [stats, setStats] = useState({});

  // Form state - aligned with backend
  const [pollForm, setPollForm] = useState({
    title: '',
    question: '',
    description: '',
    options: ['', ''],
    category: 'General',
    isPublic: true
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pollsResponse, statsResponse] = await Promise.all([
        pollApi.getAllPollsForAdmin(),
        pollApi.getStats()
      ]);
      setPolls(pollsResponse.polls || []);
      setStats(statsResponse);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load polls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form handlers
  const handleFormChange = (field, value) => {
    setPollForm(prev => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    if (pollForm.options.length < 10) {
      setPollForm(prev => ({ ...prev, options: [...prev.options, ''] }));
    }
  };

  const removeOption = (index) => {
    if (pollForm.options.length > 2) {
      setPollForm(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index, value) => {
    setPollForm(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const handleCreatePoll = async () => {
    try {
      setLoading(true);
      const validOptions = pollForm.options.filter(opt => opt.trim()).slice(0, 10);
      
      if (!pollForm.question.trim() || validOptions.length < 2) {
        setError('Question and at least 2 options required');
        return;
      }

      const pollData = {
        title: pollForm.title.trim(),
        question: pollForm.question.trim(),
        description: pollForm.description.trim(),
        options: validOptions,
        category: pollForm.category
      };

      await pollApi.createPoll(pollData);
      setSuccess('Poll created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPollForm({
      title: '',
      question: '',
      description: '',
      options: ['', ''],
      category: 'General',
      isPublic: true
    });
    setError('');
  };

  const handleStatusUpdate = async (pollId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await pollApi.updatePollStatus(pollId, newStatus);
      setSuccess(`Poll ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchData();
    } catch (err) {
      setError('Failed to update poll status');
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Are you sure you want to delete this poll?')) {
      try {
        await pollApi.deletePoll(pollId);
        setSuccess('Poll deleted successfully!');
        fetchData();
      } catch (err) {
        setError('Failed to delete poll');
      }
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  const getTotalVotes = (options) => {
    return options.reduce((sum, opt) => sum + opt.votes, 0);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={{ bgcolor: '#1976d2', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h1" gutterBottom>
            📊 Poll Management
          </Typography>
          <Typography variant="h6">
            Create and manage interactive polls for the campus community
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PollIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {stats.totalPolls || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Polls
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {stats.activePolls || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Polls
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Visibility sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {stats.totalVotes || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Votes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{ mb: 1 }}
                >
                  Create Poll
                </Button>
                <Typography variant="body2" color="text.secondary">
                  New Interactive Poll
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          All Polls ({polls.length})
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : polls.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No polls found. Create your first poll to get started!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {polls.map((poll) => (
              <Grid item xs={12} lg={6} key={poll._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {poll.title || poll.question}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={poll.isActive ? 'Active' : 'Inactive'}
                          color={getStatusColor(poll.isActive)}
                          size="small"
                        />
                        <Chip label={poll.category} variant="outlined" size="small" />
                      </Box>
                    </Box>

                    <Typography variant="body1" gutterBottom>
                      {poll.question}
                    </Typography>

                    {poll.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {poll.description}
                      </Typography>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Options:
                      </Typography>
                      <Grid container spacing={1}>
                        {poll.options.map((option, index) => (
                          <Grid xs={12} sm={6} key={index}>
                            <Chip
                              label={`${option.text} (${option.votes} votes)`}
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Created by: {poll.createdBy?.name || 'Unknown'} •
                        Total votes: {getTotalVotes(poll.options)}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleStatusUpdate(poll._id, poll.isActive)}
                        >
                          {poll.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePoll(poll._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Create Poll Dialog */}
      <Dialog open={createDialogOpen} onClose={resetForm} maxWidth="md" fullWidth>
        <DialogTitle>Create New Poll</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Poll Title (Optional)"
                value={pollForm.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="e.g., Exam Format Preference"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question *"
                multiline
                rows={2}
                value={pollForm.question}
                onChange={(e) => handleFormChange('question', e.target.value)}
                placeholder="e.g., What is your preference for exam format?"
                error={!pollForm.question.trim()}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={2}
                value={pollForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category *"
                value={pollForm.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Options (Min 2) *</Typography>
              {pollForm.options.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                  {pollForm.options.length > 2 && (
                    <IconButton color="error" onClick={() => removeOption(index)}>
                      <Cancel />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={addOption} variant="outlined" size="small">
                Add Option
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreatePoll}
            disabled={loading || !pollForm.question.trim()}
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PollManagement;
