import React from 'react';
import type { Announcement } from '../../types';

interface AnnouncementsTabProps {
  announcements: Announcement[];
}

const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({ announcements }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Announcements</h2>
      {announcements.length === 0 ? (
        <p className="text-gray-500">No announcements available.</p>
      ) : (
        announcements.map((announcement) => (
          <div key={announcement.id} className="p-4 bg-gray-50 rounded-md shadow">
            <p>{announcement.content}</p>
            <p className="text-xs text-gray-400 mt-2">
              Posted on: {new Date(announcement.created_at).toLocaleDateString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default AnnouncementsTab;

