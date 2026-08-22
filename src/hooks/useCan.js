import { useAuth } from '../contexts/AuthContext';

export default function useCan() {
    const { can } = useAuth();
    return can;
}
