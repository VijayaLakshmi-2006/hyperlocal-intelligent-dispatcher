// src/pages/Orders.jsx
import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle2, XCircle, Clock, ShoppingBag } from 'lucide-react';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import OrderCard from '../components/OrderCard';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  {
    id: 'active',
    label: 'Active',
    icon: <Clock size={15} />,
    statuses: ['PLACED', 'CONFIRMED', 'AGENT_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'],
    color: 'text-blue-600',
    activeBg: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: <CheckCircle2 size={15} />,
    statuses: ['DELIVERED'],
    color: 'text-emerald-600',
    activeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    icon: <XCircle size={15} />,
    statuses: ['CANCELLED'],
    color: 'text-red-500',
    activeBg: 'bg-red-50 border-red-200 text-red-700',
  },
];

export default function Orders() {
  const { isAgent } = useAuth();
  const [tab, setTab] = useState('active');

  const fetcher = isAgent ? orderAPI.getAgentOrders : orderAPI.getMyOrders;
  const queryKey = isAgent ? 'agentOrders' : 'myOrders';

  const { data: orders, isLoading, isError, refetch } = useQuery(queryKey, async () => {
    const res = await fetcher();
    return res.data;
  });

  const activeStatuses = ['AGENT_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY']; // For Agent

  const getTabOrders = (tabId) => {
    if (!orders) return [];
    const tabDef = STATUS_TABS.find(t => t.id === tabId);
    return orders.filter(o => tabDef.statuses.includes(o.status));
  };

  const tabOrders = getTabOrders(tab);
  const activeCount = getTabOrders('active').length;
  const completedCount = getTabOrders('completed').length;
  const cancelledCount = getTabOrders('cancelled').length;

  const getCountForTab = (tabId) => {
    if (tabId === 'active') return activeCount;
    if (tabId === 'completed') return completedCount;
    if (tabId === 'cancelled') return cancelledCount;
    return 0;
  };

  // Agent view keeps separate Active/Past sections
  if (isAgent) {
    const agentActiveOrders = orders?.filter(o => activeStatuses.includes(o.status)) || [];
    const agentPastOrders = orders?.filter(o => !activeStatuses.includes(o.status)) || [];

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Assignments</h1>
        <p className="text-gray-500 mb-8">Manage your active deliveries and past trips.</p>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Active Deliveries ({agentActiveOrders.length})
            </h2>
            <OrderGrid list={agentActiveOrders} isLoading={isLoading} isError={isError} refetch={refetch}
              emptyMsg="No active deliveries. Stay online to receive orders." role="agent" />
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-400 mb-4">Past Deliveries</h2>
            <OrderGrid list={agentPastOrders} isLoading={isLoading} isError={isError} refetch={refetch}
              emptyMsg="Your completed deliveries will appear here." role="agent" />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">My Orders</h1>
        <p className="text-gray-500">Track, view, and manage your delivery history.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-gray-200 pb-0">
        {STATUS_TABS.map(t => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 transition-all -mb-px ${
              tab === t.id
                ? `border-primary-600 text-primary-600 bg-primary-50/50`
                : `border-transparent text-gray-500 hover:text-gray-900`
            }`}
          >
            {t.icon}
            {t.label}
            {getCountForTab(t.id) > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                tab === t.id ? 'bg-white text-primary-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {getCountForTab(t.id)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <OrderGrid
        list={tabOrders}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
        role="customer"
        emptyMsg={
          tab === 'active'
            ? { title: '📦 No Active Orders', desc: 'You currently have no active deliveries.' }
            : tab === 'completed'
            ? { title: '🎉 No Completed Orders Yet', desc: 'Orders delivered successfully will appear here.' }
            : { title: '❌ No Cancelled Orders', desc: 'Cancelled orders will appear here.' }
        }
        showBrowse={tab === 'active'}
      />
    </div>
  );
}

function OrderGrid({ list, isLoading, isError, refetch, emptyMsg, role, showBrowse }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-gray-100 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
        <p className="text-red-600 font-medium">Failed to load orders. Please try again.</p>
        <button onClick={refetch} className="mt-4 btn-secondary border-red-200 text-red-700 hover:bg-red-100">Retry</button>
      </div>
    );
  }

  if (!list || list.length === 0) {
    const title = typeof emptyMsg === 'object' ? emptyMsg.title : "No Orders Yet";
    const desc = typeof emptyMsg === 'object' ? emptyMsg.desc : emptyMsg;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-20 text-center bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm max-w-sm mb-6">{desc}</p>
        {showBrowse && (
          <Link to="/stores" className="btn-primary">
            Browse Stores
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((order, idx) => (
        <motion.div
          key={order._id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <OrderCard order={order} role={role} />
        </motion.div>
      ))}
    </div>
  );
}
