import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { ResearchAssistant } from './components/ResearchAssistant';
import { ImageEditor } from './components/ImageEditor';
import { ImageGenerator } from './components/ImageGenerator';
import { CaseManagement } from './components/CaseManagement'; // Import the new component
import { NAV_ITEMS } from './constants';
import { NavigationItem } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<NavigationItem>(NAV_ITEMS[0]);

  const renderContent = () => {
    switch (activeView.id) {
      case 'dashboard':
        return <Dashboard />;
      case 'data_entry':
        return <DataEntry />;
      case 'case_management': // Add case for the new view
        return <CaseManagement />;
      case 'research_assistant':
        return <ResearchAssistant />;
      case 'image_editor':
        return <ImageEditor />;
      case 'image_generator':
        return <ImageGenerator />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
