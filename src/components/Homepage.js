import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Homepage = () => {
  const [courses, setCourses] = useState([]);
  const [userPoints, setUserPoints] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [newReferralCode, setNewReferralCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [generatingReferralCode, setGeneratingReferralCode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetch user points
        const pointsResponse = await fetch('http://localhost:5000/api/user/points', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          setUserPoints(pointsData.points);
        } else {
          setError('Failed to fetch user points');
        }

        // Fetch courses
        const coursesResponse = await fetch('http://localhost:5000/api/courses', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          console.log('Courses Data:', coursesData); // Log the courses data
          setCourses(coursesData);
          setError(null);
        } else {
          setError('Failed to fetch courses');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleGenerateReferralCode = async (courseId) => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userEmail) {
      setError('You need to be logged in to generate a referral code.');
      return;
    }

    setGeneratingReferralCode(true);

    try {
      const response = await fetch('http://localhost:5000/api/createReferralCode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referred_by: userEmail,
          course_id: courseId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewReferralCode(data.referralCode);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error generating referral code');
      }
    } catch (error) {
      setError('Error generating referral code');
    } finally {
      setGeneratingReferralCode(false);
    }
  };

  const handleVerifyReferralCode = async () => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userEmail) {
      setError('You need to be logged in to verify a referral code.');
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch('http://localhost:5000/api/verifyReferralCode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referral_code: referralCode,
          referred_user: userEmail,
          course_id: courses[0]?.course_id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.points);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error verifying referral code');
      }
    } catch (error) {
      setError('Error verifying referral code');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Available Courses</h1>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold">Your Points: {userPoints !== null ? userPoints : 'Loading...'}</h2>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold">Your Referral Code:</h2>
          <p className="text-lg">{newReferralCode || 'Not generated'}</p>
          <button
            onClick={() => handleGenerateReferralCode(courses[0]?.course_id)}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
            disabled={generatingReferralCode}
          >
            {generatingReferralCode ? 'Generating...' : 'Generate Referral Code'}
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold">Verify Referral Code:</h2>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className="border border-gray-300 p-2 rounded"
            placeholder="Enter referral code"
          />
          <button
            onClick={handleVerifyReferralCode}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
            disabled={verifying}
          >
            {verifying ? 'Verifying...' : 'Verify Referral Code'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div key={course.course_id} className="bg-white p-6 rounded-lg shadow-lg">
                <img
                  src={course.image_path}
                  alt={course.description}
                  className="w-full h-48 object-cover rounded-t-lg mb-4"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{course.description}</h2>
                  <p className="text-lg mb-2">Price: ${course.price}</p>
                  <p className="text-lg">Points: {course.course_points}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center">No courses available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
