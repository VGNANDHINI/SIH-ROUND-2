
'use client';
import React, { useState } from 'react';
import { 
  Droplets, Home, AlertCircle, Wrench, ClipboardCheck, 
  Bell, FlaskConical, Map, Users, FileText, ShieldCheck,
  Presentation, Clock, Search, BookOpen, MessageSquare,
  Camera, HelpCircle, Phone, Calendar, BarChart,
  Sparkles, Power, Layers, MapPin, FilePenLine,
  Megaphone, CheckSquare, Award, TrendingUp
} from 'lucide-react';

const IconShowcase = () => {
  const [selectedRole, setSelectedRole] = useState('gram-panchayat');

  // Role-based icon configurations with colors
  const roleIcons = {
    'gram-panchayat': {
      name: 'Gram Panchayat',
      color: 'bg-blue-500',
      icon: <Home className="w-12 h-12" />,
      features: [
        { icon: <Home className="w-8 h-8" />, name: 'Dashboard', color: 'bg-blue-100 text-blue-600', description: 'घर/मुख्य पृष्ठ' },
        { icon: <MessageSquare className="w-8 h-8" />, name: 'Complaints', color: 'bg-red-100 text-red-600', description: 'शिकायतें' },
        { icon: <Power className="w-8 h-8" />, name: 'Pump Control', color: 'bg-green-100 text-green-600', description: 'पंप नियंत्रण' },
        { icon: <Layers className="w-8 h-8" />, name: 'Tank Levels', color: 'bg-cyan-100 text-cyan-600', description: 'टैंक स्तर' },
        { icon: <Users className="w-8 h-8" />, name: 'Operators', color: 'bg-purple-100 text-purple-600', description: 'कर्मचारी' },
        { icon: <Bell className="w-8 h-8" />, name: 'Alerts', color: 'bg-orange-100 text-orange-600', description: 'सूचनाएं' },
        { icon: <FlaskConical className="w-8 h-8" />, name: 'Water Quality', color: 'bg-teal-100 text-teal-600', description: 'पानी की गुणवत्ता' },
        { icon: <Map className="w-8 h-8" />, name: 'GIS Map', color: 'bg-indigo-100 text-indigo-600', description: 'नक्शा' },
      ]
    },
    'pump-operator': {
      name: 'Pump Operator',
      color: 'bg-green-500',
      icon: <Wrench className="w-12 h-12" />,
      features: [
        { icon: <Home className="w-8 h-8" />, name: 'Dashboard', color: 'bg-blue-100 text-blue-600', description: 'घर' },
        { icon: <Clock className="w-8 h-8" />, name: 'Schedule', color: 'bg-yellow-100 text-yellow-600', description: 'समय सारणी' },
        { icon: <ClipboardCheck className="w-8 h-8" />, name: 'Checklist', color: 'bg-green-100 text-green-600', description: 'जांच सूची' },
        { icon: <Power className="w-8 h-8" />, name: 'Pump Status', color: 'bg-red-100 text-red-600', description: 'पंप स्थिति' },
        { icon: <AlertCircle className="w-8 h-8" />, name: 'Report Issue', color: 'bg-orange-100 text-orange-600', description: 'समस्या रिपोर्ट' },
        { icon: <Wrench className="w-8 h-8" />, name: 'Maintenance', color: 'bg-purple-100 text-purple-600', description: 'रखरखाव' },
        { icon: <Search className="w-8 h-8" />, name: 'Leak Detection', color: 'bg-cyan-100 text-cyan-600', description: 'रिसाव खोजें' },
        { icon: <BookOpen className="w-8 h-8" />, name: 'SOP Library', color: 'bg-indigo-100 text-indigo-600', description: 'प्रशिक्षण' },
      ]
    },
    'village-resident': {
      name: 'Village Resident',
      color: 'bg-purple-500',
      icon: <Users className="w-12 h-12" />,
      features: [
        { icon: <Home className="w-8 h-8" />, name: 'Home', color: 'bg-blue-100 text-blue-600', description: 'घर' },
        { icon: <Droplets className="w-8 h-8" />, name: 'Water Available?', color: 'bg-cyan-100 text-cyan-600', description: 'पानी है?' },
        { icon: <FilePenLine className="w-8 h-8" />, name: 'Complaint', color: 'bg-red-100 text-red-600', description: 'शिकायत' },
        { icon: <FlaskConical className="w-8 h-8" />, name: 'Water Quality', color: 'bg-teal-100 text-teal-600', description: 'पानी शुद्ध?' },
        { icon: <BarChart className="w-8 h-8" />, name: 'Reports', color: 'bg-purple-100 text-purple-600', description: 'रिपोर्ट' },
        { icon: <Sparkles className="w-8 h-8" />, name: 'AI Help', color: 'bg-pink-100 text-pink-600', description: 'मदद' },
        { icon: <HelpCircle className="w-8 h-8" />, name: 'Help', color: 'bg-orange-100 text-orange-600', description: 'सहायता' },
      ]
    },
    'block-official': {
      name: 'Block Official',
      color: 'bg-indigo-500',
      icon: <ShieldCheck className="w-12 h-12" />,
      features: [
        { icon: <Home className="w-8 h-8" />, name: 'Dashboard', color: 'bg-blue-100 text-blue-600', description: 'घर' },
        { icon: <CheckSquare className="w-8 h-8" />, name: 'Approvals', color: 'bg-green-100 text-green-600', description: 'स्वीकृति' },
        { icon: <Presentation className="w-8 h-8" />, name: 'Analytics', color: 'bg-purple-100 text-purple-600', description: 'विश्लेषण' },
        { icon: <ShieldCheck className="w-8 h-8" />, name: 'Verification', color: 'bg-yellow-100 text-yellow-600', description: 'सत्यापन' },
        { icon: <FlaskConical className="w-8 h-8" />, name: 'Water Quality', color: 'bg-teal-100 text-teal-600', description: 'पानी गुणवत्ता' },
      ]
    }
  };

  const currentRole = roleIcons[selectedRole];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
              <Droplets className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">JalShakthi</h1>
              <p className="text-gray-600">जलशक्ति - स्मार्ट जल प्रबंधन</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">
              <strong>🎯 Design Philosophy:</strong> Icons that speak to everyone - from educated officials to non-literate villagers
            </p>
          </div>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(roleIcons).map(([key, role]) => (
            <button
              key={key}
              onClick={() => setSelectedRole(key)}
              className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
                selectedRole === key 
                  ? `${role.color} text-white shadow-lg` 
                  : 'bg-white text-gray-700 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`${selectedRole === key ? 'opacity-100' : 'opacity-70'}`}>
                  {role.icon}
                </div>
                <span className="font-semibold text-sm text-center">{role.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Icons Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 ${currentRole.color} rounded-xl flex items-center justify-center text-white`}>
              {currentRole.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{currentRole.name} Features</h2>
              <p className="text-gray-600">Visual navigation for all users</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentRole.features.map((feature, index) => (
              <div
                key={index}
                className="group cursor-pointer"
              >
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 hover:shadow-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-blue-200">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform shadow-md`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-800 text-center mb-1 text-sm">
                    {feature.name}
                  </h3>
                  <p className="text-xs text-gray-600 text-center font-medium">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Design Principles */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Universal Icons</h3>
            <p className="text-sm text-gray-600">Recognizable symbols that transcend language barriers</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Color Coding</h3>
            <p className="text-sm text-gray-600">Intuitive colors: Red for urgent, Green for safe, Blue for info</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Bilingual Labels</h3>
            <p className="text-sm text-gray-600">English + Hindi for maximum accessibility</p>
          </div>
        </div>

        {/* Implementation Tips */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="text-xl font-bold mb-4">🏆 SIH 2025 Winning Strategy</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <h4 className="font-semibold mb-2">✓ Accessibility First</h4>
              <p className="text-sm">Large touch targets (min 48px), high contrast, voice support</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <h4 className="font-semibold mb-2">✓ Offline Capability</h4>
              <p className="text-sm">Critical features work without internet using Firebase cache</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <h4 className="font-semibold mb-2">✓ Progressive Disclosure</h4>
              <p className="text-sm">Show only essential icons first, hide complexity</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <h4 className="font-semibold mb-2">✓ Visual Feedback</h4>
              <p className="text-sm">Animations, sounds, vibrations confirm actions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconShowcase;
