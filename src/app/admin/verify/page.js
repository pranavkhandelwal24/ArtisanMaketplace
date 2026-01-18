"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminVerificationPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // Track specific row loading

    // Security check: ensure user is logged in and is an admin
    useEffect(() => {
        if (!authLoading) {
            // Check for the custom isAdmin flag initialized in AuthContext
            if (!user || !user.isAdmin) {
                router.push('/'); // Redirect non-admins to the homepage
            } else {
                fetchSubmissions();
            }
        }
    }, [user, authLoading, router]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            // Fetch only submissions that are still 'pending'
            const q = query(collection(db, "verificationSubmissions"), where("status", "==", "pending"));
            const querySnapshot = await getDocs(q);
            const subs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubmissions(subs);
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (submissionId, artisanUid) => {
        setActionLoading(submissionId);
        try {
            // 1. Update the user's main profile to grant artisan access
            const userDocRef = doc(db, 'users', artisanUid);
            await updateDoc(userDocRef, { 
                role: 'artisan',
                isVerifiedArtisan: true 
            });

            // 2. Update the submission status to 'approved'
            const submissionDocRef = doc(db, 'verificationSubmissions', submissionId);
            await updateDoc(submissionDocRef, { status: 'approved' });

            // 3. Refresh the list locally
            setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
        } catch (error) {
            console.error("Error approving submission:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (submissionId) => {
        setActionLoading(submissionId);
        try {
            const submissionDocRef = doc(db, 'verificationSubmissions', submissionId);
            await updateDoc(submissionDocRef, { status: 'rejected' });
            
            // Refresh the list locally
            setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
        } catch (error) {
            console.error("Error rejecting submission:", error);
        } finally {
            setActionLoading(null);
        }
    };
    
    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-50">
                <div className="text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground font-medium">Loading verification queue...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
                <p className="text-muted-foreground mt-2">Manage artisan applications and ensure marketplace quality.</p>
            </div>

            <Card className="shadow-sm border-stone-200">
                <CardHeader className="bg-stone-50/50 border-b">
                    <CardTitle>Artisan Verification Requests</CardTitle>
                    <CardDescription>
                        Review the submitted documents carefully before granting seller permissions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {submissions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-stone-50 hover:bg-stone-50">
                                    <TableHead className="font-semibold">Artisan Info</TableHead>
                                    <TableHead className="font-semibold">Documents</TableHead>
                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.map(sub => (
                                    <TableRow key={sub.id} className="hover:bg-stone-50/50 transition-colors">
                                        <TableCell>
                                            <div className="font-medium">{sub.displayName}</div>
                                            <div className="text-xs text-muted-foreground">{sub.email}</div>
                                            <div className="text-[10px] mt-1 text-stone-400">UID: {sub.uid}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                <Button asChild variant="outline" size="sm" className="h-8">
                                                    <Link href={sub.aadhaarUrl} target="_blank">
                                                        Aadhaar <ExternalLink className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm" className="h-8">
                                                    <Link href={sub.panUrl} target="_blank">
                                                        PAN <ExternalLink className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm" className="h-8">
                                                    <Link href={sub.addressProofUrl} target="_blank">
                                                        Address <ExternalLink className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm" className="h-8">
                                                    <Link href={sub.workProofUrl} target="_blank">
                                                        Work Proof <ExternalLink className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="default"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleApprove(sub.id, sub.uid)}
                                                    disabled={actionLoading === sub.id}
                                                >
                                                    {actionLoading === sub.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <><CheckCircle className="mr-1 h-4 w-4" /> Approve</>
                                                    )}
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="destructive"
                                                    onClick={() => handleReject(sub.id)}
                                                    disabled={actionLoading === sub.id}
                                                >
                                                    {actionLoading === sub.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <><XCircle className="mr-1 h-4 w-4" /> Reject</>
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-20">
                            <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-6 w-6 text-stone-400" />
                            </div>
                            <h3 className="text-lg font-medium text-stone-900">Queue Empty</h3>
                            <p className="text-muted-foreground mt-1 text-sm">There are no pending artisan verification requests at this time.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
