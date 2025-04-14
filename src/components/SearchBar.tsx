import { Search } from 'lucide-react';

interface Props {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const SearchBar = ({ searchQuery, setSearchQuery }: Props) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search recipes..."
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

export default SearchBar;
