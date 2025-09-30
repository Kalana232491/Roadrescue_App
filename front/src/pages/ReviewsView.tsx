import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { providers, reviews as reviewsApi } from '@/lib/api';
import { toast } from 'sonner';

interface Review {
  id: number;
  rating: number;
  comment?: string;
  created_at: string;
  author_username: string;
}

type ProfileStatus = 'checking' | 'needsProfile' | 'ready';

export default function ReviewsView() {
  const { user } = useAuth();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('checking');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (user?.role === 'provider') {
      void loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setProfileStatus('checking');
    try {
      const response = await providers.getMyProfile();
      const profile = response.data;

      if (!profile) {
        setProfileStatus('needsProfile');
        setReviews([]);
        setAverageRating(0);
        setLoading(false);
        return;
      }

      setProfileStatus('ready');
      await loadReviews(profile.id);
    } catch (error) {
      console.error('Failed to load provider profile:', error);
      toast.error('Unable to load provider profile. Please try again.');
      setProfileStatus('needsProfile');
      setReviews([]);
      setAverageRating(0);
      setLoading(false);
    }
  };

  const loadReviews = async (id: number) => {
    setLoading(true);
    try {
      const response = await reviewsApi.getReviews(id);
      const list: Review[] = response.data;
      setReviews(list);

      if (list.length) {
        const total = list.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(total / list.length);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('Unable to load reviews. Please try again.');
      setReviews([]);
      setAverageRating(0);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
        }`}
      />
    ))
  );

  if (!user || user.role !== 'provider') {
    return <div>Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {profileStatus !== 'ready' ? (
          <Card className="max-w-2xl mx-auto text-center py-12">
            <CardContent>
              {profileStatus === 'checking' ? (
                <>
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Checking your provider profile...</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">Create your provider profile</h3>
                  <p className="text-muted-foreground mb-4">
                    Reviews will appear once you have a provider profile.
                  </p>
                  <Button asChild>
                    <Link to="/profile-management">Set up profile</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Reviews Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <span className="text-2xl font-bold">
                    {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}
                  </span>
                  <Badge variant="secondary">
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading reviews...</p>
                  </CardContent>
                </Card>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id} className="shadow-soft">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{review.author_username}</span>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    {review.comment && (
                      <CardContent>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">
                      Your reviews will appear here once customers start rating your services
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

