"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// Add a new field to your user type in AuthContext if you want strong typing
// For now, we'll check for it dynamically
// in AuthContext.tsx: export interface AuthUser extends FirebaseUser { ... isAdmin?: boolean; }

export default function AdminVerificationPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [submissions, setSubmissions] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Security check: ensure user is logged in and is an admin
        if (!authLoading) {
            // @ts-ignore - Check for our custom isAdmin flag
            if (!user || !user.isAdmin) {
                router.push('/'); // Redirect non-admins to the homepage
            } else {
                fetchSubmissions();
            }
        }
    }, [user, authLoading, router]);

    const fetchSubmissions = async () => {
        setLoading(true);
        const q = query(collection(db, "verificationSubmissions"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        const subs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(subs);
        setLoading(false);
    };

    const handleApprove = async (submissionId: string, artisanUid: string) => {
        try {
            // Update the user's main profile to grant access
            const userDocRef = doc(db, 'users', artisanUid);
            await updateDoc(userDocRef, { isVerifiedArtisan: true });

            // Update the submission status
            const submissionDocRef = doc(db, 'verificationSubmissions', submissionId);
            await updateDoc(submissionDocRef, { status: 'approved' });

            // Refresh the list
            fetchSubmissions();
        } catch (error) {
            console.error("Error approving submission:", error);
        }
    };

    const handleReject = async (submissionId: string) => {
        try {
            const submissionDocRef = doc(db, 'verificationSubmissions', submissionId);
            await updateDoc(submissionDocRef, { status: 'rejected' });
            fetchSubmissions();
        } catch (error) {
            console.error("Error rejecting submission:", error);
        }
    };
    
    if (authLoading || loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <main className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Artisan Verification Requests</CardTitle>
                    <CardDescription>Review and approve new artisan applications.</CardDescription>
                </CardHeader>
                <CardContent>
                    {submissions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Artisan Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Documents</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell>{sub.displayName}</TableCell>
                                        <TableCell>{sub.email}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Link href={sub.aadhaarUrl} target="_blank" className="underline">Aadhaar</Link>
                                            <Link href={sub.panUrl} target="_blank" className="underline">PAN</Link>
                                            <Link href={sub.addressProofUrl} target="_blank" className="underline">Address</Link>
                                            <Link href={sub.workProofUrl} target="_blank" className="underline">Work</Link>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" onClick={() => handleApprove(sub.id, sub.uid)}>Approve</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleReject(sub.id)}>Reject</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No pending submissions.</p>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
